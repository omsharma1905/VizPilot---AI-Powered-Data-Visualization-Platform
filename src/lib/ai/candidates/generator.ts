/**
 * Deterministic Candidate Generator — Phase 2C
 *
 * Scans a VizPilotDataProfile and deterministically generates structurally compatible
 * visualization candidates. No LLMs. No hallucinations.
 */

import type { VizPilotDataProfile, VizPilotTableProfile, VizPilotColumnProfile } from '@/src/types/profiling';
import type { VizPilotVisualizationCandidate } from '../types';
import { checkDimensionCompatibility, checkMeasureCompatibility } from './rules';

export function generateCandidates(profile: VizPilotDataProfile): VizPilotVisualizationCandidate[] {
  const candidates: VizPilotVisualizationCandidate[] = [];
  let candidateCounter = 1;

  for (const table of profile.tables) {
    if (table.isEmpty || table.rowCount === 0) continue;

    const temporals = table.columns.filter((c) => c.semanticRole === 'timestamp');
    const measures = table.columns.filter(
      (c) =>
        c.semanticRole === 'measure' ||
        c.semanticRole === 'currency-amount' ||
        c.semanticRole === 'percentage' ||
        (c.inferredType === 'integer' && c.semanticRole !== 'identifier') ||
        (c.inferredType === 'number' && c.semanticRole !== 'identifier')
    );
    const categories = table.columns.filter(
      (c) =>
        c.semanticRole === 'category' ||
        c.semanticRole === 'geolocation' ||
        (c.inferredType === 'string' && c.semanticRole !== 'identifier')
    );

    // ── 1. LINE / AREA CHARTS (Temporal Trend) ──────────────────────────────
    for (const tCol of temporals) {
      for (const mCol of measures) {
        const mCheck = checkMeasureCompatibility(mCol);
        if (!mCheck.isCompatible) continue;

        let baseScore = 65 + mCheck.scoreAdjustment;
        const reasons = [
          `Time series tracking of ${mCol.name} over ${tCol.name}.`,
          ...mCheck.reasons,
        ];

        // Primary Line Candidate
        candidates.push({
          id: `cand_${candidateCounter++}`,
          tableId: table.tableId,
          chartType: 'line',
          analyticalIntent: 'trend',
          fields: { x: tCol.name, y: [mCol.name] },
          aggregation: { function: 'sum', field: mCol.name },
          baseScore: Math.min(95, Math.max(50, baseScore + 6)),
          reasons: [...reasons, 'Line chart emphasizes chronological trend and rates of change.'],
          constraints: { isTemporal: true, isNumeric: true, cardinality: tCol.quality.uniqueCount },
        });

        // Area Candidate (for volume accumulation)
        candidates.push({
          id: `cand_${candidateCounter++}`,
          tableId: table.tableId,
          chartType: 'area',
          analyticalIntent: 'change_over_time',
          fields: { x: tCol.name, y: [mCol.name] },
          aggregation: { function: 'sum', field: mCol.name },
          baseScore: Math.min(92, Math.max(45, baseScore + 2)),
          reasons: [...reasons, 'Area chart communicates cumulative volume progression over time.'],
          constraints: { isTemporal: true, isNumeric: true, cardinality: tCol.quality.uniqueCount },
        });

        // Secondary Bar Candidate (for discrete period comparison)
        candidates.push({
          id: `cand_${candidateCounter++}`,
          tableId: table.tableId,
          chartType: 'bar',
          analyticalIntent: 'comparison',
          fields: { x: tCol.name, y: [mCol.name], category: tCol.name },
          aggregation: { function: 'sum', field: mCol.name },
          baseScore: Math.min(75, Math.max(40, baseScore - 15)),
          reasons: [...reasons, 'Discrete period-by-period comparison.'],
          constraints: { isTemporal: true, isNumeric: true, cardinality: tCol.quality.uniqueCount },
        });
      }
    }

    // ── 2. BAR / HORIZONTAL BAR (Categorical Comparison & Ranking) ────────────
    for (const cCol of categories) {
      const dimCheck = checkDimensionCompatibility(cCol, 'bar');
      if (!dimCheck.isCompatible) continue;

      for (const mCol of measures) {
        const mCheck = checkMeasureCompatibility(mCol);
        if (!mCheck.isCompatible) continue;

        const baseScore = 52 + dimCheck.scoreAdjustment + mCheck.scoreAdjustment;
        const card = cCol.quality.uniqueCount;

        // Choose orientation preference: horizontal bar for > 8 categories or long names
        const preferHorizontal = card > 8 || cCol.name.length > 12;

        candidates.push({
          id: `cand_${candidateCounter++}`,
          tableId: table.tableId,
          chartType: preferHorizontal ? 'horizontal_bar' : 'bar',
          analyticalIntent: preferHorizontal ? 'ranking' : 'comparison',
          fields: { x: preferHorizontal ? mCol.name : cCol.name, y: [preferHorizontal ? cCol.name : mCol.name], category: cCol.name },
          aggregation: { function: 'sum', field: mCol.name },
          baseScore: Math.min(95, Math.max(45, baseScore)),
          reasons: [
            `Compare total ${mCol.name} across ${cCol.name} categories.`,
            ...dimCheck.reasons,
            ...mCheck.reasons,
          ],
          constraints: { cardinality: card, isNumeric: true },
        });

        // Add complementary bar orientation if meaningful
        if (preferHorizontal) {
          candidates.push({
            id: `cand_${candidateCounter++}`,
            tableId: table.tableId,
            chartType: 'bar',
            analyticalIntent: 'comparison',
            fields: { x: cCol.name, y: [mCol.name], category: cCol.name },
            aggregation: { function: 'sum', field: mCol.name },
            baseScore: Math.min(90, Math.max(40, baseScore)),
            reasons: [`Vertical column comparison of ${mCol.name} by ${cCol.name}.`],
            constraints: { cardinality: card, isNumeric: true },
          });
        }
      }
    }

    // ── 3. GROUPED / STACKED BARS (Multi-Dimensional Breakdown) ──────────────
    if (categories.length >= 2 && measures.length >= 1) {
      const primaryDim = categories[0];
      const secondaryDim = categories[1];
      const mCol = measures[0];

      const pCheck = checkDimensionCompatibility(primaryDim, 'grouped_bar');
      const sCheck = checkDimensionCompatibility(secondaryDim, 'grouped_bar');
      const mCheck = checkMeasureCompatibility(mCol);

      if (pCheck.isCompatible && sCheck.isCompatible && mCheck.isCompatible && secondaryDim.quality.uniqueCount <= 6) {
        candidates.push({
          id: `cand_${candidateCounter++}`,
          tableId: table.tableId,
          chartType: 'grouped_bar',
          analyticalIntent: 'comparison',
          fields: { x: primaryDim.name, y: [mCol.name], color: secondaryDim.name, category: primaryDim.name },
          aggregation: { function: 'sum', field: mCol.name },
          baseScore: 82,
          reasons: [`Segmented comparison of ${mCol.name} across ${primaryDim.name} grouped by ${secondaryDim.name}.`],
          constraints: { cardinality: primaryDim.quality.uniqueCount, hasSecondaryDimension: true, isNumeric: true },
        });

        candidates.push({
          id: `cand_${candidateCounter++}`,
          tableId: table.tableId,
          chartType: 'stacked_bar',
          analyticalIntent: 'composition',
          fields: { x: primaryDim.name, y: [mCol.name], color: secondaryDim.name, category: primaryDim.name },
          aggregation: { function: 'sum', field: mCol.name },
          baseScore: 80,
          reasons: [`Composition breakdown showing aggregate ${mCol.name} across ${primaryDim.name} stacked by ${secondaryDim.name}.`],
          constraints: { cardinality: primaryDim.quality.uniqueCount, hasSecondaryDimension: true, isNumeric: true },
        });
      }
    }

    // ── 4. PIE / DONUT CHARTS (Part-to-Whole Breakdown) ──────────────────────
    for (const cCol of categories) {
      const dimCheck = checkDimensionCompatibility(cCol, 'pie');
      if (!dimCheck.isCompatible) continue;

      for (const mCol of measures) {
        const mCheck = checkMeasureCompatibility(mCol);
        if (!mCheck.isCompatible) continue;

        const baseScore = 65 + dimCheck.scoreAdjustment + mCheck.scoreAdjustment;
        const card = cCol.quality.uniqueCount;

        candidates.push({
          id: `cand_${candidateCounter++}`,
          tableId: table.tableId,
          chartType: 'pie',
          analyticalIntent: 'part_to_whole',
          fields: { category: cCol.name, y: [mCol.name] },
          aggregation: { function: 'sum', field: mCol.name },
          baseScore: Math.min(85, Math.max(40, baseScore)),
          reasons: [
            `Proportional breakdown of ${mCol.name} among ${cCol.name} segments.`,
            ...dimCheck.reasons,
          ],
          constraints: { cardinality: card, isNumeric: true },
        });

        candidates.push({
          id: `cand_${candidateCounter++}`,
          tableId: table.tableId,
          chartType: 'donut',
          analyticalIntent: 'part_to_whole',
          fields: { category: cCol.name, y: [mCol.name] },
          aggregation: { function: 'sum', field: mCol.name },
          baseScore: Math.min(85, Math.max(40, baseScore + 2)),
          reasons: [`Modern circular proportion view of ${mCol.name} by ${cCol.name}.`],
          constraints: { cardinality: card, isNumeric: true },
        });
      }
    }

    // ── 5. SCATTER PLOT (Two Numeric Measures Relationship) ──────────────────
    if (measures.length >= 2) {
      for (let i = 0; i < measures.length; i++) {
        for (let j = i + 1; j < measures.length; j++) {
          const m1 = measures[i];
          const m2 = measures[j];

          const m1Check = checkMeasureCompatibility(m1);
          const m2Check = checkMeasureCompatibility(m2);
          if (!m1Check.isCompatible || !m2Check.isCompatible) continue;

          // Check if statistical correlation was detected in Phase 2B
          const corrRel = profile.relationships.find(
            (r) =>
              r.kind === 'correlated' &&
              ((r.fromColumnId === m1.columnId && r.toColumnId === m2.columnId) ||
                (r.fromColumnId === m2.columnId && r.toColumnId === m1.columnId))
          );

          let baseScore = 65;
          const reasons = [`Evaluate bivariate distribution between ${m1.name} and ${m2.name}.`];

          if (corrRel && corrRel.correlationCoefficient !== undefined) {
            baseScore += 20;
            reasons.push(`Detected strong correlation (r=${corrRel.correlationCoefficient}) between these variables.`);
          }

          candidates.push({
            id: `cand_${candidateCounter++}`,
            tableId: table.tableId,
            chartType: 'scatter',
            analyticalIntent: 'relationship',
            fields: { x: m1.name, y: [m2.name] },
            baseScore: Math.min(95, Math.max(45, baseScore)),
            reasons,
            constraints: { isNumeric: true },
          });
        }
      }
    }

    // ── 6. HISTOGRAM (Continuous Metric Distribution) ────────────────────────
    for (const mCol of measures) {
      const mCheck = checkMeasureCompatibility(mCol);
      if (!mCheck.isCompatible) continue;

      candidates.push({
        id: `cand_${candidateCounter++}`,
        tableId: table.tableId,
        chartType: 'histogram',
        analyticalIntent: 'distribution',
        fields: { x: mCol.name },
        baseScore: 68,
        reasons: [`Inspect the frequency distribution and spread of ${mCol.name}.`],
        constraints: { isNumeric: true },
      });
    }

    // ── 7. KPI SUMMARY CARD (Key Metrics Aggregate) ──────────────────────────
    for (const mCol of measures) {
      const mCheck = checkMeasureCompatibility(mCol);
      if (!mCheck.isCompatible) continue;

      candidates.push({
        id: `cand_${candidateCounter++}`,
        tableId: table.tableId,
        chartType: 'kpi_card',
        analyticalIntent: 'kpi',
        fields: { y: [mCol.name] },
        aggregation: { function: 'sum', field: mCol.name },
        baseScore: 70,
        reasons: [`High-level executive total summary for ${mCol.name}.`],
        constraints: { isNumeric: true },
      });
    }
  }

  // Sort candidates by baseScore descending
  return candidates.sort((a, b) => b.baseScore - a.baseScore);
}

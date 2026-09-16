/**
 * Targeted Intelligence Correction Test Suite — Phase 2C & 2D
 *
 * Verifies:
 * 1. Business performance dataset profile (Month is recognized as temporal)
 * 2. Temporal semantic priority (Line/Area beat generic Bar for trend)
 * 3. Categorical comparison priority (Bar beats Line for non-temporal categories)
 * 4. Multi-metric dataset reasoning and non-uniform confidence calibration
 * 5. Deterministic chronological ascending rendering (no reverse ordering)
 * 6. Mathematical aggregation accuracy for monthly Revenue totals (108.3k, 118.3k, 129.7k, 137.6k)
 * 7. Temporal format variants (YYYY-MM, YYYY-MM-DD, MM/DD/YYYY, MM/YYYY, ISO datetimes)
 * 8. Analytical distinction across 6 reference scenarios
 * 9. Chart switching integrity without LLM dependency
 */

import { inferColumnType, classifyValue } from '../src/lib/ingestion/inference';
import { profileDataset } from '../src/lib/profiling';
import { generateCandidates } from '../src/lib/ai/candidates/generator';
import { calculateCandidateScore, calibrateConfidence } from '../src/lib/ai/scoring/visualization';
import { getVisualizationRecommendation } from '../src/lib/ai/recommendation';
import { generateVisualization } from '../src/lib/visualization';
import type { VizPilotDataset } from '../src/types/dataset';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${testName}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${testName}${detail ? ` (${detail})` : ''}`);
  }
}

/**
 * Synthetic business performance fixture matching the real DOCX structure:
 * 12 rows, 4 months (2026-01 to 2026-04), 3 records per month.
 * Monthly Revenue sums:
 * 2026-01: 30000 + 45000 + 33300 = 108,300
 * 2026-02: 35000 + 48000 + 35300 = 118,300
 * 2026-03: 40000 + 52000 + 37700 = 129,700
 * 2026-04: 42000 + 55000 + 40600 = 137,600
 */
function createBusinessPerformanceDataset(): VizPilotDataset {
  const rawData = [
    // Month, Region, Product, Revenue, Cost, Profit, Orders
    ['2026-01', 'North', 'Alpha', 30000, 18000, 12000, 150],
    ['2026-01', 'South', 'Beta',  45000, 27000, 18000, 210],
    ['2026-01', 'West',  'Alpha', 33300, 20000, 13300, 160],

    ['2026-02', 'North', 'Beta',  35000, 21000, 14000, 175],
    ['2026-02', 'South', 'Alpha', 48000, 28500, 19500, 230],
    ['2026-02', 'West',  'Beta',  35300, 21200, 14100, 170],

    ['2026-03', 'North', 'Alpha', 40000, 24000, 16000, 190],
    ['2026-03', 'South', 'Beta',  52000, 31000, 21000, 250],
    ['2026-03', 'West',  'Alpha', 37700, 22600, 15100, 180],

    ['2026-04', 'North', 'Beta',  42000, 25000, 17000, 205],
    ['2026-04', 'South', 'Alpha', 55000, 33000, 22000, 265],
    ['2026-04', 'West',  'Beta',  40600, 24400, 16200, 195],
  ];

  return {
    id: 'ds-biz-perf',
    name: 'Business Performance Q1-Q2',
    source: {
      fileName: 'Business_Performance.docx',
      fileSize: 45000,
      fileType: 'docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      uploadedAt: new Date().toISOString(),
      mode: 'workspace',
    },
    tables: [
      {
        id: 'tbl-perf',
        name: 'Monthly_Performance',
        columns: [
          { id: 'c1', name: 'Month',   index: 0, inferredType: 'date', sampleValues: ['2026-01', '2026-02'], nullable: false, nullCount: 0, totalCount: 12 },
          { id: 'c2', name: 'Region',  index: 1, inferredType: 'string', sampleValues: ['North', 'South'], nullable: false, nullCount: 0, totalCount: 12 },
          { id: 'c3', name: 'Product', index: 2, inferredType: 'string', sampleValues: ['Alpha', 'Beta'], nullable: false, nullCount: 0, totalCount: 12 },
          { id: 'c4', name: 'Revenue', index: 3, inferredType: 'currency', sampleValues: [30000, 45000], nullable: false, nullCount: 0, totalCount: 12 },
          { id: 'c5', name: 'Cost',    index: 4, inferredType: 'currency', sampleValues: [18000, 27000], nullable: false, nullCount: 0, totalCount: 12 },
          { id: 'c6', name: 'Profit',  index: 5, inferredType: 'currency', sampleValues: [12000, 18000], nullable: false, nullCount: 0, totalCount: 12 },
          { id: 'c7', name: 'Orders',  index: 6, inferredType: 'integer', sampleValues: [150, 210], nullable: false, nullCount: 0, totalCount: 12 },
        ],
        rows: rawData,
        rowCount: 12,
        columnCount: 7,
      },
    ],
    extraction: {
      method: 'document-table',
      durationMs: 25,
      confidence: 0.95,
      warnings: [],
      tablesDetected: 1,
    },
    createdAt: new Date().toISOString(),
    processingMode: 'workspace',
  };
}

async function runCorrectionTests() {
  console.log('\n==================================================');
  console.log('VIZPILOT — TARGETED INTELLIGENCE CORRECTION SUITE');
  console.log('==================================================\n');

  // -------------------------------------------------------------
  // Test 1: Ingestion & Inference for Temporal Formats (Part A & H)
  // -------------------------------------------------------------
  console.log('1. Temporal Format Ingestion & Inference:');
  assert(classifyValue('2026-01') === 'date', 'classifyValue("2026-01") is date');
  assert(classifyValue('2026-12') === 'date', 'classifyValue("2026-12") is date');
  assert(classifyValue('2026/04') === 'date', 'classifyValue("2026/04") is date');
  assert(classifyValue('01/2026') === 'date', 'classifyValue("01/2026") is date');
  assert(classifyValue('2026-04-15') === 'date', 'classifyValue("2026-04-15") is date');
  assert(classifyValue('04/15/2026') === 'date', 'classifyValue("04/15/2026") is date');
  assert(classifyValue('2026-04-15T10:00:00Z') === 'datetime', 'classifyValue ISO datetime is datetime');

  const monthValues = ['2026-01', '2026-02', '2026-03', '2026-04'];
  assert(inferColumnType(monthValues) === 'date', 'inferColumnType(["2026-01", ...]) is date');

  // -------------------------------------------------------------
  // Test 2: Phase 2B Profiling of Test Dataset (Part A)
  // -------------------------------------------------------------
  console.log('\n2. Profile Representation of Test Dataset:');
  const dataset = createBusinessPerformanceDataset();
  const profile = profileDataset(dataset);
  const tblProf = profile.tables[0];

  const monthCol = tblProf.columns.find((c) => c.name === 'Month');
  assert(monthCol !== undefined, 'Month column profile exists');
  assert(monthCol?.inferredType === 'date', 'Month inferredType is date');
  assert(monthCol?.semanticRole === 'timestamp', 'Month semanticRole is timestamp');
  assert(
    monthCol?.statistics.kind === 'temporal' && monthCol.statistics.stats.granularity === 'month',
    'Month granularity is detected as month'
  );

  const revCol = tblProf.columns.find((c) => c.name === 'Revenue');
  assert(revCol?.semanticRole === 'currency-amount', 'Revenue semanticRole is currency-amount');

  // -------------------------------------------------------------
  // Test 3: Candidate Generation & Temporal Semantic Priority (Part B)
  // -------------------------------------------------------------
  console.log('\n3. Candidate Generation & Temporal Priority:');
  const candidates = generateCandidates(profile);
  const lineCandidates = candidates.filter((c) => c.chartType === 'line' && c.fields.x === 'Month');
  const areaCandidates = candidates.filter((c) => c.chartType === 'area' && c.fields.x === 'Month');
  const barTemporalCandidates = candidates.filter((c) => c.chartType === 'bar' && c.fields.x === 'Month');

  assert(lineCandidates.length > 0, 'Generated Line candidate for Month + Measure');
  assert(areaCandidates.length > 0, 'Generated Area candidate for Month + Measure');
  assert(barTemporalCandidates.length > 0, 'Generated Bar candidate for Month + Measure');

  // -------------------------------------------------------------
  // Test 4: Analytical Scoring Distinction (Part C & D)
  // -------------------------------------------------------------
  console.log('\n4. Analytical Intent Scoring Distinction:');
  const lineRevCand = lineCandidates.find((c) => c.fields.y?.[0] === 'Revenue')!;
  const barRevCand = barTemporalCandidates.find((c) => c.fields.y?.[0] === 'Revenue')!;

  const lineScore = calculateCandidateScore(lineRevCand, profile);
  const barScore = calculateCandidateScore(barRevCand, profile);

  assert(lineScore > barScore, `Line (${lineScore}) scores higher than Bar (${barScore}) for temporal trend`);
  assert(lineScore - barScore >= 10, `Meaningful analytical advantage for Line over Bar (+${lineScore - barScore} pts)`);

  // Category + measure should favor Bar over Line
  const regBarCand = candidates.find((c) => (c.chartType === 'bar' || c.chartType === 'horizontal_bar') && c.fields.x === 'Region' || c.fields.category === 'Region');
  assert(regBarCand !== undefined, 'Generated Bar candidate for Region comparison');
  if (regBarCand) {
    const regScore = calculateCandidateScore(regBarCand, profile);
    assert(regScore >= 85, `Region Bar comparison has high score (${regScore})`);
  }

  // -------------------------------------------------------------
  // Test 5: Confidence Calibration (Part E & J)
  // -------------------------------------------------------------
  console.log('\n5. Confidence Calibration & Non-Uniformity:');
  const topScore = lineScore;
  const runnerUp = barScore;
  const calibratedPrimary = calibrateConfidence(topScore, runnerUp);

  assert(calibratedPrimary >= 0.50 && calibratedPrimary <= 0.96, `Primary confidence is properly bounded (${calibratedPrimary})`);

  // Verify non-uniform confidence across alternatives
  const recommendation = await getVisualizationRecommendation(profile);
  assert(recommendation.primary.chartType === 'line', 'Top recommendation is Line chart');
  assert(recommendation.primary.fields.x === 'Month', 'Top recommendation x-axis is Month');

  const confidences = [recommendation.primary.confidence, ...recommendation.alternatives.map((a) => a.confidence)];
  const uniqueConfidences = new Set(confidences);
  assert(
    uniqueConfidences.size > 1,
    `Confidences are differentiated and non-uniform (unique values: ${Array.from(uniqueConfidences).join(', ')})`
  );
  assert(
    !confidences.every((c) => Math.round(c * 100) === 96),
    'Confidences are NOT uniformly 96%'
  );

  // -------------------------------------------------------------
  // Test 6: Deterministic Chronological Ascending Rendering (Part F & M)
  // -------------------------------------------------------------
  console.log('\n6. Chronological Ascending Rendering:');
  const vizResult = generateVisualization(dataset, recommendation);
  const renderedCategories = (vizResult.option.xAxis as any)?.data as string[];

  assert(Array.isArray(renderedCategories), 'Rendered xAxis has categories array');
  assert(renderedCategories.length === 4, `Rendered exactly 4 months (${renderedCategories.length})`);
  assert(renderedCategories[0] === '2026-01', `First month is 2026-01 (got: ${renderedCategories[0]})`);
  assert(renderedCategories[1] === '2026-02', `Second month is 2026-02 (got: ${renderedCategories[1]})`);
  assert(renderedCategories[2] === '2026-03', `Third month is 2026-03 (got: ${renderedCategories[2]})`);
  assert(renderedCategories[3] === '2026-04', `Fourth month is 2026-04 (got: ${renderedCategories[3]})`);

  // Verify exact aggregated values (Part M)
  // 2026-01 -> 108,300 | 2026-02 -> 118,300 | 2026-03 -> 129,700 | 2026-04 -> 137,600
  const renderedValues = (vizResult.option.series as any)[0].data as number[];
  assert(renderedValues[0] === 108300, `2026-01 sum is 108,300 (got: ${renderedValues[0]})`);
  assert(renderedValues[1] === 118300, `2026-02 sum is 118,300 (got: ${renderedValues[1]})`);
  assert(renderedValues[2] === 129700, `2026-03 sum is 129,700 (got: ${renderedValues[2]})`);
  assert(renderedValues[3] === 137600, `2026-04 sum is 137,600 (got: ${renderedValues[3]})`);

  // -------------------------------------------------------------
  // Test 7: Manual User Chart Switching (Part K)
  // -------------------------------------------------------------
  console.log('\n7. User Chart Switching Without Re-calling AI:');
  const switchedBar = generateVisualization(dataset, recommendation, { overrideChartType: 'bar' });
  assert(switchedBar.chartType === 'bar', 'Switched to Bar successfully');
  const barCats = (switchedBar.option.xAxis as any)?.data as string[];
  assert(barCats[0] === '2026-01' && barCats[3] === '2026-04', 'Switched Bar retains ascending chronological order');

  const switchedArea = generateVisualization(dataset, recommendation, { overrideChartType: 'area' });
  assert(switchedArea.chartType === 'area', 'Switched to Area successfully');

  // -------------------------------------------------------------
  // Test 8: Analytical Distinction Across 6 Scenarios (Part I)
  // -------------------------------------------------------------
  console.log('\n8. Analytical Distinction Across 6 Scenarios:');

  // Scenario A: Date + Revenue -> line/area strongest
  const candA_Line = { ...lineRevCand, chartType: 'line' as const, analyticalIntent: 'trend' as const };
  const candA_Bar = { ...lineRevCand, chartType: 'bar' as const, analyticalIntent: 'comparison' as const };
  assert(
    calculateCandidateScore(candA_Line, profile) > calculateCandidateScore(candA_Bar, profile),
    'Scenario A: Line beats Bar for Date + Revenue'
  );

  // Scenario B: Region + Revenue -> bar strongest
  const candB_Bar = {
    id: 'b1', tableId: 'tbl-perf', chartType: 'bar' as const, analyticalIntent: 'comparison' as const,
    fields: { x: 'Region', y: ['Revenue'] }, baseScore: 85, reasons: [], constraints: { isTemporal: false, cardinality: 3 },
  };
  const candB_Line = {
    id: 'b2', tableId: 'tbl-perf', chartType: 'line' as const, analyticalIntent: 'comparison' as const,
    fields: { x: 'Region', y: ['Revenue'] }, baseScore: 60, reasons: [], constraints: { isTemporal: false, cardinality: 3 },
  };
  assert(
    calculateCandidateScore(candB_Bar, profile) > calculateCandidateScore(candB_Line, profile),
    'Scenario B: Bar beats Line for Region + Revenue'
  );

  // Scenario C: Revenue + Cost -> scatter strongest
  const candC_Scatter = {
    id: 'c1', tableId: 'tbl-perf', chartType: 'scatter' as const, analyticalIntent: 'relationship' as const,
    fields: { x: 'Revenue', y: ['Cost'] }, baseScore: 85, reasons: [], constraints: { isNumeric: true },
  };
  const candC_Bar = {
    id: 'c2', tableId: 'tbl-perf', chartType: 'bar' as const, analyticalIntent: 'comparison' as const,
    fields: { x: 'Revenue', y: ['Cost'] }, baseScore: 60, reasons: [], constraints: { isNumeric: true },
  };
  assert(
    calculateCandidateScore(candC_Scatter, profile) > calculateCandidateScore(candC_Bar, profile),
    'Scenario C: Scatter beats Bar for Revenue + Cost'
  );

  // Scenario D: Distribution -> histogram strongest
  const candD_Hist = {
    id: 'd1', tableId: 'tbl-perf', chartType: 'histogram' as const, analyticalIntent: 'distribution' as const,
    fields: { x: 'Revenue' }, baseScore: 85, reasons: [], constraints: { isNumeric: true },
  };
  const candD_Bar = {
    id: 'd2', tableId: 'tbl-perf', chartType: 'bar' as const, analyticalIntent: 'comparison' as const,
    fields: { x: 'Revenue' }, baseScore: 60, reasons: [], constraints: { isNumeric: true },
  };
  assert(
    calculateCandidateScore(candD_Hist, profile) > calculateCandidateScore(candD_Bar, profile),
    'Scenario D: Histogram beats Bar for distribution'
  );

  // Scenario E: Region + Revenue with low cardinality -> pie valid
  const candE_Pie = {
    id: 'e1', tableId: 'tbl-perf', chartType: 'pie' as const, analyticalIntent: 'part_to_whole' as const,
    fields: { x: 'Region', y: ['Revenue'] }, baseScore: 80, reasons: [], constraints: { cardinality: 3 },
  };
  assert(calculateCandidateScore(candE_Pie, profile) >= 75, 'Scenario E: Low-cardinality Pie has healthy score');

  // Scenario F: High-cardinality pie rejected / penalized
  const candF_PieHigh = {
    id: 'f1', tableId: 'tbl-perf', chartType: 'pie' as const, analyticalIntent: 'part_to_whole' as const,
    fields: { x: 'Region', y: ['Revenue'] }, baseScore: 80, reasons: [], constraints: { cardinality: 35 },
  };
  assert(
    calculateCandidateScore(candF_PieHigh, profile) < calculateCandidateScore(candE_Pie, profile) - 20,
    'Scenario F: High-cardinality Pie heavily penalized'
  );

  console.log('\n==================================================');
  console.log(`TARGETED CORRECTION TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('==================================================\n');

  if (failed > 0) process.exit(1);
}

runCorrectionTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});

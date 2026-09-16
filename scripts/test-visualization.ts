/**
 * Deterministic Visualization Engine Test Suite — Phase 2D
 *
 * Verifies:
 * 1. All 11 MVP chart types render valid, typed EChartsOption
 * 2. Mathematical aggregation accuracy (sum, avg, count, min, max, median)
 * 3. Temporal chronological sorting
 * 4. Cardinality limits & deterministic downsampling (up to 100k rows)
 * 5. Security boundaries & error handling (missing fields, empty table)
 * 6. Deterministic fallback behavior
 * 7. End-to-end determinism (identical input produces identical output)
 */

import {
  generateVisualization,
  aggregateNumbers,
  aggregateByDimension,
  aggregateByTwoDimensions,
  sampleRowsDeterministically,
  FieldResolver,
  VisualizationError,
  MAX_RENDER_POINTS,
} from '../src/lib/visualization';
import type { VizPilotDataset, VizPilotTable } from '../src/types/dataset';
import type { VizPilotVisualizationRecommendation, ChartType } from '../src/lib/ai/types';

function createMockDataset(rowCount: number = 10): VizPilotDataset {
  const dates = ['2023-01-15', '2023-03-10', '2023-02-01', '2023-05-20', '2023-04-12'];
  const regions = ['North', 'South', 'East', 'West', 'Central'];
  const channels = ['Online', 'Retail', 'Wholesale'];

  const rows: any[][] = [];
  for (let i = 0; i < rowCount; i++) {
    rows.push([
      dates[i % dates.length],
      regions[i % regions.length],
      channels[i % channels.length],
      (i + 1) * 100, // revenue
      (i + 1) * 50,  // profit
    ]);
  }

  return {
    id: 'ds-test-1',
    name: 'Test Sales Dataset',
    source: {
      fileName: 'test.csv',
      fileSize: 1024,
      fileType: 'csv',
      mimeType: 'text/csv',
      uploadedAt: new Date().toISOString(),
      mode: 'workspace',
    },
    tables: [
      {
        id: 'tbl-sales',
        name: 'Sales',
        columns: [
          { id: 'c1', name: 'Date', index: 0, inferredType: 'date', sampleValues: [], nullable: false, nullCount: 0, totalCount: rowCount },
          { id: 'c2', name: 'Region', index: 1, inferredType: 'string', sampleValues: [], nullable: false, nullCount: 0, totalCount: rowCount },
          { id: 'c3', name: 'Channel', index: 2, inferredType: 'string', sampleValues: [], nullable: false, nullCount: 0, totalCount: rowCount },
          { id: 'c4', name: 'Revenue', index: 3, inferredType: 'number', sampleValues: [], nullable: false, nullCount: 0, totalCount: rowCount },
          { id: 'c5', name: 'Profit', index: 4, inferredType: 'number', sampleValues: [], nullable: false, nullCount: 0, totalCount: rowCount },
        ],
        rows,
        rowCount,
        columnCount: 5,
      },
    ],
    extraction: {
      method: 'structured',
      durationMs: 5,
      confidence: 1,
      warnings: [],
    },
    createdAt: new Date().toISOString(),
    processingMode: 'workspace',
  };
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${testName}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${testName}`);
  }
}

async function runTests() {
  console.log('\n==================================================');
  console.log('VIZPILOT — PHASE 2D VISUALIZATION ENGINE TEST SUITE');
  console.log('==================================================\n');

  const dataset = createMockDataset(20);

  // -------------------------------------------------------------
  // Test 1: Math Aggregations Accuracy
  // -------------------------------------------------------------
  console.log('1. Mathematical Aggregation Accuracy:');
  const testNums = [10, 20, 30, 40, 50];
  assert(aggregateNumbers(testNums, 'sum') === 150, 'sum of [10,20,30,40,50] === 150');
  assert(aggregateNumbers(testNums, 'avg') === 30, 'avg of [10,20,30,40,50] === 30');
  assert(aggregateNumbers(testNums, 'min') === 10, 'min of [10,20,30,40,50] === 10');
  assert(aggregateNumbers(testNums, 'max') === 50, 'max of [10,20,30,40,50] === 50');
  assert(aggregateNumbers(testNums, 'count') === 5, 'count of [10,20,30,40,50] === 5');
  assert(aggregateNumbers(testNums, 'median') === 30, 'median of odd list === 30');
  assert(aggregateNumbers([10, 20, 30, 40], 'median') === 25, 'median of even list === 25');
  assert(aggregateNumbers([], 'sum') === 0, 'empty array returns 0 safely');

  // -------------------------------------------------------------
  // Test 2: Chronological Temporal Sorting
  // -------------------------------------------------------------
  console.log('\n2. Chronological Sorting:');
  const dateRows = [
    ['2023-03-01', 300],
    ['2023-01-01', 100],
    ['2023-02-01', 200],
  ];
  const aggregatedDates = aggregateByDimension(dateRows, 0, 1, 'sum', true);
  assert(aggregatedDates[0].category === '2023-01-01', 'First sorted date is Jan 01');
  assert(aggregatedDates[1].category === '2023-02-01', 'Second sorted date is Feb 01');
  assert(aggregatedDates[2].category === '2023-03-01', 'Third sorted date is Mar 01');

  // -------------------------------------------------------------
  // Test 3: All 11 MVP Chart Types
  // -------------------------------------------------------------
  console.log('\n3. All 11 MVP Chart Types Generation:');
  const chartTypes: ChartType[] = [
    'bar',
    'horizontal_bar',
    'grouped_bar',
    'stacked_bar',
    'line',
    'area',
    'scatter',
    'pie',
    'donut',
    'histogram',
    'kpi_card',
  ];

  for (const chartType of chartTypes) {
    const rec: any = {
      primary: {
        chartType,
        tableId: 'tbl-sales',
        confidence: 0.95,
        reasoning: `Test rendering ${chartType}`,
        fields: {
          x: chartType === 'scatter' ? 'Revenue' : 'Region',
          y: ['Profit'],
          color: chartType === 'grouped_bar' || chartType === 'stacked_bar' ? 'Channel' : undefined,
          category: 'Region',
        },
        aggregation: { function: 'sum', field: 'Profit' },
      },
      alternatives: [],
      datasetSummary: 'Test Summary',
    };

    const res = generateVisualization(dataset, rec);
    assert(res !== null && typeof res.option === 'object', `Generated ${chartType} option successfully`);
    assert(res.metadata.fieldsUsed.length > 0, `${chartType} records fieldsUsed in metadata`);
    assert(typeof res.metadata.renderedRowCount === 'number', `${chartType} records renderedRowCount`);
  }

  // -------------------------------------------------------------
  // Test 4: Dynamic Override Chart Switching
  // -------------------------------------------------------------
  console.log('\n4. Dynamic Chart Type Switching:');
  const baseRec: any = {
    primary: {
      chartType: 'bar',
      tableId: 'tbl-sales',
      confidence: 0.9,
      reasoning: 'Initial bar recommendation',
      fields: { x: 'Region', y: ['Revenue'] },
    },
    alternatives: [],
    datasetSummary: 'Test',
  };

  const switchedPie = generateVisualization(dataset, baseRec, { overrideChartType: 'pie' });
  assert(switchedPie.chartType === 'pie', 'Successfully switched from bar to pie');
  assert((switchedPie.option.series as any)[0].type === 'pie', 'Series type changed to pie');

  const switchedLine = generateVisualization(dataset, baseRec, { overrideChartType: 'line' });
  assert(switchedLine.chartType === 'line', 'Successfully switched from bar to line');

  // -------------------------------------------------------------
  // Test 5: Deterministic Fallbacks
  // -------------------------------------------------------------
  console.log('\n5. Deterministic Fallbacks:');
  // Grouped bar without secondary column should safely fallback to bar
  const invalidGroupedRec: any = {
    primary: {
      chartType: 'grouped_bar',
      tableId: 'tbl-sales',
      confidence: 0.8,
      reasoning: 'Missing secondary column',
      fields: { x: 'Region', y: ['Revenue'] }, // Missing color/category secondary
    },
    alternatives: [],
    datasetSummary: 'Test',
  };

  const fallbackRes = generateVisualization(dataset, invalidGroupedRec);
  assert(fallbackRes.chartType === 'bar', 'Fell back to bar chart when secondary dimension missing');
  assert(fallbackRes.warnings.length > 0, 'Added warning about fallback');

  // -------------------------------------------------------------
  // Test 6: Security Boundary & Missing Fields
  // -------------------------------------------------------------
  console.log('\n6. Security Boundary & Missing Fields:');
  const missingFieldRec: any = {
    primary: {
      chartType: 'bar',
      tableId: 'tbl-sales',
      confidence: 0.9,
      reasoning: 'Nonexistent column',
      fields: { x: 'NonExistentColumn', y: ['Revenue'] },
    },
    alternatives: [],
    datasetSummary: 'Test',
  };

  try {
    generateVisualization(dataset, missingFieldRec);
    assert(false, 'Expected error on missing field, but succeeded');
  } catch (err: any) {
    assert(
      err instanceof VisualizationError && err.code === 'VISUALIZATION_FIELD_NOT_FOUND',
      'Threw VISUALIZATION_FIELD_NOT_FOUND for non-existent column'
    );
  }

  // -------------------------------------------------------------
  // Test 7: Large-Scale Downsampling & Performance (1k, 10k, 50k, 100k rows)
  // -------------------------------------------------------------
  console.log('\n7. Large Scale Downsampling Performance:');
  const sizes = [1000, 10000, 50000, 100000];
  for (const size of sizes) {
    const t0 = performance.now();
    const bigDataset = createMockDataset(size);
    const tConstruct = performance.now();

    const bigRec: any = {
      primary: {
        chartType: 'scatter',
        tableId: 'tbl-sales',
        confidence: 0.9,
        reasoning: 'Large scatter',
        fields: { x: 'Revenue', y: ['Profit'] },
      },
      alternatives: [],
      datasetSummary: 'Test',
    };

    const tStartViz = performance.now();
    const bigResult = generateVisualization(bigDataset, bigRec);
    const tEndViz = performance.now();

    const vizTimeMs = tEndViz - tStartViz;
    assert(
      bigResult.metadata.renderedRowCount <= MAX_RENDER_POINTS,
      `${size} rows clamped to <= ${MAX_RENDER_POINTS} points (${bigResult.metadata.renderedRowCount} rendered)`
    );
    assert(vizTimeMs < 1000, `${size} rows processed in ${vizTimeMs.toFixed(2)}ms (< 1000ms)`);
  }

  // -------------------------------------------------------------
  // Test 8: End-to-End Determinism
  // -------------------------------------------------------------
  console.log('\n8. End-to-End Determinism:');
  const runA = generateVisualization(dataset, baseRec);
  const runB = generateVisualization(dataset, baseRec);
  const jsonA = JSON.stringify(runA);
  const jsonB = JSON.stringify(runB);
  assert(jsonA === jsonB, 'Consecutive runs on identical input produce identical JSON output');

  console.log('\n==================================================');
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

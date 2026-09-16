import { profileDataset } from '../src/lib/profiling';
import type { VizPilotDataset, VizPilotTable, VizPilotColumn, DataValue } from '../src/types/dataset';

function generateBenchmarkDataset(rowCount: number, colCount: number = 8): VizPilotDataset {
  const columns: VizPilotColumn[] = ([
    { id: 'col_0_id', name: 'ID', index: 0, inferredType: 'integer' as const, sampleValues: [1, 2, 3], nullable: false, nullCount: 0, totalCount: rowCount },
    { id: 'col_1_region', name: 'Region', index: 1, inferredType: 'string' as const, sampleValues: ['North', 'South'], nullable: false, nullCount: 0, totalCount: rowCount },
    { id: 'col_2_rev', name: 'Revenue', index: 2, inferredType: 'currency' as const, sampleValues: [1000, 2000], nullable: false, nullCount: 0, totalCount: rowCount },
    { id: 'col_3_cost', name: 'Cost', index: 3, inferredType: 'currency' as const, sampleValues: [500, 1000], nullable: false, nullCount: 0, totalCount: rowCount },
    { id: 'col_4_date', name: 'Date', index: 4, inferredType: 'date' as const, sampleValues: ['2026-01-01', '2026-01-02'], nullable: false, nullCount: 0, totalCount: rowCount },
    { id: 'col_5_active', name: 'Active', index: 5, inferredType: 'boolean' as const, sampleValues: [true, false], nullable: false, nullCount: 0, totalCount: rowCount },
    { id: 'col_6_category', name: 'Category', index: 6, inferredType: 'string' as const, sampleValues: ['CatA', 'CatB'], nullable: false, nullCount: 0, totalCount: rowCount },
    { id: 'col_7_rate', name: 'Rate', index: 7, inferredType: 'percentage' as const, sampleValues: [0.15, 0.20], nullable: true, nullCount: Math.floor(rowCount * 0.05), totalCount: rowCount },
  ] as VizPilotColumn[]).slice(0, colCount);


  const regions = ['North', 'South', 'East', 'West'];
  const categories = ['Tech', 'Health', 'Finance', 'Retail', 'Education'];
  const rows: DataValue[][] = new Array(rowCount);

  for (let i = 0; i < rowCount; i++) {
    const rev = 1000 + (i % 500) * 10;
    const cost = rev * 0.6;
    const dateStr = `2026-01-${String((i % 28) + 1).padStart(2, '0')}`;

    rows[i] = [
      i + 1,
      regions[i % regions.length],
      rev,
      cost,
      dateStr,
      i % 2 === 0,
      categories[i % categories.length],
      i % 20 === 0 ? null : (i % 100) / 100,
    ].slice(0, colCount);
  }

  const table: VizPilotTable = {
    id: `tbl_bench_${rowCount}`,
    name: `Benchmark_${rowCount}`,
    columns,
    rows,
    rowCount,
    columnCount: columns.length,
  };

  return {
    id: `ds_bench_${rowCount}`,
    name: `Benchmark_${rowCount}_Rows`,
    source: {
      fileName: `bench_${rowCount}.csv`,
      fileSize: rowCount * 120,
      fileType: 'csv',
      mimeType: 'text/csv',
      uploadedAt: new Date().toISOString(),
      mode: 'zerotrace',
    },
    tables: [table],
    extraction: {
      method: 'structured',
      durationMs: 50,
      confidence: 1.0,
      warnings: [],
    },
    createdAt: new Date().toISOString(),
    processingMode: 'zerotrace',
  };
}

async function runBenchmark() {
  console.log('⚡ Running VizPilot Phase 2B Profiler Performance Benchmarks...\n');

  const scales = [1_000, 10_000, 50_000, 100_000];
  const results: Array<{ rows: number; durationMs: number; memoryMB: number }> = [];

  for (const rowCount of scales) {
    const dataset = generateBenchmarkDataset(rowCount);

    if (global.gc) {
      global.gc();
    }
    const memBefore = process.memoryUsage().heapUsed;

    const start = performance.now();
    const profile = profileDataset(dataset);
    const durationMs = performance.now() - start;

    const memAfter = process.memoryUsage().heapUsed;
    const memUsedMB = Math.max(0, (memAfter - memBefore) / (1024 * 1024));

    results.push({
      rows: rowCount,
      durationMs: Math.round(durationMs),
      memoryMB: Math.round(memUsedMB * 10) / 10,
    });

    console.log(
      `  • ${rowCount.toLocaleString().padStart(7, ' ')} rows x 8 cols: ` +
      `${durationMs.toFixed(1)}ms | ` +
      `Quality: ${profile.quality.overallScore} | ` +
      `Relationships: ${profile.relationships.length}`
    );
  }

  console.log('\n======================================================');
  console.log('                 PROFILER BENCHMARK SUMMARY           ');
  console.log('======================================================');
  console.log('| Row Count | Duration (ms) | Approx Memory (MB)     |');
  console.log('|-----------|---------------|------------------------|');
  for (const r of results) {
    console.log(
      `| ${r.rows.toLocaleString().padEnd(9, ' ')} | ${String(r.durationMs).padEnd(13, ' ')} | ${String(r.memoryMB).padEnd(22, ' ')} |`
    );
  }
  console.log('======================================================\n');
}

runBenchmark().catch((err) => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});

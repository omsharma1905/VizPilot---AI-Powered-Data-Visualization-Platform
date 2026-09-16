import { ingestFile } from '../src/lib/ingestion';
import { profileDataset, PROFILER_VERSION } from '../src/lib/profiling';
import type { VizPilotDataset } from '../src/types/dataset';
import * as XLSX from 'xlsx';

async function runProfilingTests() {
  console.log('🧪 Starting VizPilot Phase 2B Deterministic Profiling Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
      failed++;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FIXTURE A: SALES DATASET (Standard measures, dimensions, dates, currency)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('📊 Fixture A: Sales Dataset (Measures, Dimensions, Dates)');
  {
    const csvContent = [
      'Date,Region,Product,Revenue,Cost,Profit',
      '2026-01-01,North,Alpha,$1000,$600,$400',
      '2026-02-01,South,Beta,$1500,$900,$600',
      '2026-03-01,East,Gamma,$2000,$1200,$800',
      '2026-04-01,West,Alpha,$2500,$1500,$1000',
      '2026-05-01,North,Beta,$3000,$1800,$1200',
      '2026-06-01,South,Gamma,$3500,$2100,$1400',
      '2026-07-01,East,Alpha,$4000,$2400,$1600',
      '2026-08-01,West,Beta,$4500,$2700,$1800',
      '2026-09-01,North,Gamma,$5000,$3000,$2000',
      '2026-10-01,South,Alpha,$5500,$3300,$2200',
      '2026-11-01,East,Beta,$6000,$3600,$2400',
      '2026-12-01,West,Gamma,$6500,$3900,$2600',
    ].join('\n');

    const buffer = Buffer.from(csvContent, 'utf-8');
    const dataset = await ingestFile({
      fileName: 'sales_fixture.csv',
      fileSize: buffer.length,
      buffer,
    });

    const profile = profileDataset(dataset);

    assert(profile.engineVersion === PROFILER_VERSION, 'Engine version is set correctly');
    assert(profile.summary.totalRows === 12, 'Summary rows count is 12');
    assert(profile.summary.totalColumns === 6, 'Summary column count is 6');
    assert(profile.summary.numericColumns === 3, 'Summary numeric count is 3 (Revenue, Cost, Profit)');
    assert(profile.summary.temporalColumns === 1, 'Summary temporal count is 1 (Date)');
    assert(profile.summary.categoricalColumns === 2, 'Summary categorical count is 2 (Region, Product)');

    const table = profile.tables[0];
    assert(table.rowCount === 12, 'Table rowCount is 12');
    assert(table.columnCount === 6, 'Table columnCount is 6');

    // Check Semantic Roles
    const dateCol = table.columns.find((c) => c.name === 'Date');
    const regionCol = table.columns.find((c) => c.name === 'Region');
    const revCol = table.columns.find((c) => c.name === 'Revenue');
    const profitCol = table.columns.find((c) => c.name === 'Profit');

    assert(dateCol?.semanticRole === 'timestamp', 'Date semantic role is timestamp');
    assert(regionCol?.semanticRole === 'geolocation' || regionCol?.semanticRole === 'category', 'Region semantic role is category or geolocation');
    assert(revCol?.semanticRole === 'currency-amount' || revCol?.semanticRole === 'measure', 'Revenue semantic role is currency-amount/measure');
    assert(profitCol?.semanticRole === 'currency-amount' || profitCol?.semanticRole === 'measure', 'Profit semantic role is currency-amount/measure');

    // Check Numeric Statistics
    if (revCol && revCol.statistics.kind === 'numeric') {
      const stats = revCol.statistics.stats;
      assert(stats.min === 1000, 'Revenue min is 1000');
      assert(stats.max === 6500, 'Revenue max is 6500');
      assert(stats.mean === 3750, 'Revenue mean is 3750');
      assert(stats.distinctCount === 12, 'Revenue distinct count is 12');
      assert(stats.histogram.counts.length > 0, 'Revenue histogram bins generated');
    } else {
      assert(false, 'Revenue statistics kind is numeric');
    }

    // Check Temporal Statistics & Granularity
    if (dateCol && dateCol.statistics.kind === 'temporal') {
      const tStats = dateCol.statistics.stats;
      assert(tStats.minDate.startsWith('2026-01-01'), 'Date minDate matches expected start');
      assert(tStats.maxDate.startsWith('2026-12-01'), 'Date maxDate matches expected end');
      assert(tStats.granularity === 'month', 'Date granularity is detected as month');
    } else {
      assert(false, 'Date statistics kind is temporal');
    }

    // Check Correlation & Relationships
    const revProfitRel = profile.relationships.find(
      (r) =>
        r.kind === 'correlated' &&
        ((r.fromColumnId === revCol?.columnId && r.toColumnId === profitCol?.columnId) ||
         (r.fromColumnId === profitCol?.columnId && r.toColumnId === revCol?.columnId))
    );
    assert(revProfitRel !== undefined, 'Detected correlation relationship between Revenue and Profit');
    if (revProfitRel) {
      assert(revProfitRel.correlationCoefficient === 1, 'Revenue & Profit perfect correlation r=1.0');
    }

    const dateRevRel = profile.relationships.find(
      (r) => r.kind === 'date-hierarchy' && r.fromColumnId === dateCol?.columnId
    );
    assert(dateRevRel !== undefined, 'Detected date-hierarchy relationship for Date -> Measure');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FIXTURE B: CUSTOMER DATASET (Identifiers, Booleans, Categories, Ages)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n👥 Fixture B: Customer Dataset (Identifiers, Booleans, Categories)');
  {
    const csvContent = [
      'CustomerID,Name,Age,Region,SignupDate,Active',
      '101,Alice Johnson,28,North,2025-01-15,true',
      '102,Bob Smith,34,South,2025-02-20,false',
      '103,Charlie Brown,45,East,2025-03-12,true',
      '104,Diana Prince,31,West,2025-04-05,true',
      '105,Evan Wright,22,North,2025-05-18,false',
      '106,Fiona Gallagher,29,South,2025-06-25,true',
      '107,George Clark,52,East,2025-07-30,true',
      '108,Hannah Abbott,41,West,2025-08-14,false',
      '109,Ian Malcolm,38,North,2025-09-09,true',
      '110,Julia Roberts,27,South,2025-10-01,true',
    ].join('\n');

    const buffer = Buffer.from(csvContent, 'utf-8');
    const dataset = await ingestFile({
      fileName: 'customers.csv',
      fileSize: buffer.length,
      buffer,
    });

    const profile = profileDataset(dataset);
    const table = profile.tables[0];

    const idCol = table.columns.find((c) => c.name === 'CustomerID');
    const activeCol = table.columns.find((c) => c.name === 'Active');
    const nameCol = table.columns.find((c) => c.name === 'Name');

    assert(idCol?.semanticRole === 'identifier', 'CustomerID is classified as identifier');
    assert(activeCol?.semanticRole === 'boolean-flag', 'Active is classified as boolean-flag');

    if (activeCol && activeCol.statistics.kind === 'boolean') {
      assert(activeCol.statistics.stats.trueCount === 7, 'Active trueCount is 7');
      assert(activeCol.statistics.stats.falseCount === 3, 'Active falseCount is 3');
      assert(activeCol.statistics.stats.trueRate === 0.7, 'Active trueRate is 0.7');
    } else {
      assert(false, 'Active column statistics kind is boolean');
    }

    // Check primary key relationship
    const pkRel = profile.relationships.find(
      (r) => r.kind === 'primary-key' && r.fromColumnId === idCol?.columnId
    );
    assert(pkRel !== undefined, 'CustomerID detected as primary-key relationship');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FIXTURE C: MESSY DATASET (Nulls, Constants, Duplicates, Quality Scoring)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n⚠️ Fixture C: Messy Dataset (High Nulls, Constants, Duplicates)');
  {
    const csvContent = [
      'ID,ConstantCol,NullHeavyCol,NormalCol',
      '1,StaticValue,,Alpha',
      '2,StaticValue,,Beta',
      '3,StaticValue,,Alpha',
      '4,StaticValue,SomeVal,Beta',
      '4,StaticValue,SomeVal,Beta', // Duplicate row
    ].join('\n');

    const buffer = Buffer.from(csvContent, 'utf-8');
    const dataset = await ingestFile({
      fileName: 'messy.csv',
      fileSize: buffer.length,
      buffer,
    });

    const profile = profileDataset(dataset);
    const table = profile.tables[0];

    const constCol = table.columns.find((c) => c.name === 'ConstantCol');
    const nullCol = table.columns.find((c) => c.name === 'NullHeavyCol');

    assert(constCol?.quality.isConstant === true, 'ConstantCol flagged as constant');
    assert((nullCol?.quality.nullRate ?? 0) > 0.5, 'NullHeavyCol flagged with null rate > 50%');


    assert(table.duplicateRowCount === 1, 'Detected 1 duplicate row');
    assert(profile.quality.hasHighNullColumns === true, 'Dataset hasHighNullColumns is true');

    // Warnings should be emitted
    const constWarning = profile.warnings.find((w) => w.code === 'CONSTANT_COLUMN');
    const nullWarning = profile.warnings.find((w) => w.code === 'HIGH_NULL_RATE');
    assert(constWarning !== undefined, 'Emitted CONSTANT_COLUMN warning');
    assert(nullWarning !== undefined, 'Emitted HIGH_NULL_RATE warning');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FIXTURE D: MULTI-SHEET WORKBOOK (Independent profiles per sheet)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n📑 Fixture D: Multi-Sheet Workbook');
  {
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet([
      ['Dept', 'Headcount'],
      ['Engineering', 45],
      ['Sales', 30],
      ['Marketing', 15],
    ]);
    const ws2 = XLSX.utils.aoa_to_sheet([
      ['SKU', 'Inventory', 'Warehouse'],
      ['A100', 500, 'North'],
      ['B200', 300, 'South'],
    ]);
    XLSX.utils.book_append_sheet(wb, ws1, 'Staff');
    XLSX.utils.book_append_sheet(wb, ws2, 'Inventory');

    const xlsxBuffer = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
    const dataset = await ingestFile({
      fileName: 'multi_sheet.xlsx',
      fileSize: xlsxBuffer.length,
      buffer: xlsxBuffer,
    });

    const profile = profileDataset(dataset);

    assert(profile.summary.tableCount === 2, 'Summary tableCount is 2');
    assert(profile.tables.length === 2, 'Profile tables length is 2');
    assert(profile.tables[0].name === 'Staff', 'First sheet preserved as Staff');
    assert(profile.tables[1].name === 'Inventory', 'Second sheet preserved as Inventory');
    assert(profile.tables[0].rowCount === 3, 'Staff row count is 3');
    assert(profile.tables[1].rowCount === 2, 'Inventory row count is 2');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FIXTURE E: DOCUMENT TABLE DATASET (Empty table scenario)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n📄 Fixture E: Empty Table Handling');
  {
    const mockDataset: VizPilotDataset = {
      id: 'ds_empty',
      name: 'EmptyDoc',
      source: {
        fileName: 'empty.pdf',
        fileSize: 100,
        fileType: 'pdf',
        mimeType: 'application/pdf',
        uploadedAt: new Date().toISOString(),
        mode: 'zerotrace',
      },
      tables: [
        {
          id: 'tbl_0_empty',
          name: 'Empty Table',
          columns: [],
          rows: [],
          rowCount: 0,
          columnCount: 0,
        },
      ],
      extraction: {
        method: 'document-text',
        durationMs: 10,
        confidence: 0.5,
        warnings: [],
      },
      createdAt: new Date().toISOString(),
      processingMode: 'zerotrace',
    };

    const profile = profileDataset(mockDataset);
    assert(profile.tables[0].isEmpty === true, 'Empty table handled safely and marked isEmpty=true');
    assert(profile.warnings.some((w) => w.code === 'EMPTY_TABLE'), 'Emitted EMPTY_TABLE warning');
  }

  console.log(`\n========================================`);
  console.log(`Profiling Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runProfilingTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

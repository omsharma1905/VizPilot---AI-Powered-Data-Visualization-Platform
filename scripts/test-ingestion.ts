import * as XLSX from 'xlsx';
import { ingestFile } from '../src/lib/ingestion';
import { IngestionError, type IngestionErrorCode } from '../src/lib/ingestion/errors';
import { inferColumnType, classifyValue } from '../src/lib/ingestion/inference';
import type {
  VizPilotDataset,
  VizPilotTextBlock,
  VizPilotDocumentContent,
  ExtractionMethod,
} from '../src/types';
import type {
  VizPilotDataProfile,
  VizPilotTableProfile,
  VizPilotColumnProfile,
  VizPilotDataQuality,
  VizPilotRelationship,
  ProfileWarning,
  SemanticRole,
} from '../src/types/profiling';


async function runTests() {
  console.log('🧪 Starting VizPilot Phase 2A.2 Data Ingestion Test Suite...\n');
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

  // ───────────────────────────────────────────────────────────────────────────
  // TEST GROUP 1: CSV INGESTION
  // ───────────────────────────────────────────────────────────────────────────
  console.log('📁 Group 1: CSV Ingestion');

  // 1. Normal Sales CSV
  {
    const csvContent = 'Month,Revenue,Expenses,Customers\nJul,420000,310000,1240\nAug,468000,325000,1380\nSep,512000,340000,1520';
    const buffer = Buffer.from(csvContent, 'utf-8');
    const dataset = await ingestFile({
      fileName: 'sales_q3.csv',
      fileSize: buffer.length,
      buffer,
      mode: 'workspace',
    });

    assert(dataset.tables.length === 1, 'CSV creates exactly 1 table');
    assert(dataset.tables[0].rowCount === 3, 'CSV row count is 3');
    assert(dataset.tables[0].columnCount === 4, 'CSV column count is 4');
    assert(dataset.tables[0].columns[1].inferredType === 'integer', 'Revenue inferred as integer');
    assert(dataset.tables[0].columns[0].inferredType === 'string', 'Month inferred as string');
  }

  // 2. Quoted Commas & Special Characters
  {
    const csvContent = 'ID,Product Name,Price\n1,"Enterprise, Cloud Edition",999.50\n2,"Starter, Single User",49.99';
    const buffer = Buffer.from(csvContent, 'utf-8');
    const dataset = await ingestFile({
      fileName: 'products.csv',
      fileSize: buffer.length,
      buffer,
    });

    assert(dataset.tables[0].rows[0][1] === 'Enterprise, Cloud Edition', 'Quoted comma parsed correctly');
    assert(dataset.tables[0].columns[2].inferredType === 'number', 'Price decimal inferred as number');
  }

  // 3. Empty Values Coalescing
  {
    const csvContent = 'Region,Q1,Q2,Q3\nNorth,100,,300\nSouth,,,400';
    const buffer = Buffer.from(csvContent, 'utf-8');
    const dataset = await ingestFile({
      fileName: 'sparse.csv',
      fileSize: buffer.length,
      buffer,
    });

    assert(dataset.tables[0].rows[0][2] === null, 'Empty CSV cell coerced to null');
    assert(dataset.tables[0].rows[1][1] === null && dataset.tables[0].rows[1][2] === null, 'Multiple empty cells coerced to null');
    assert(dataset.tables[0].columns[1].nullable === true, 'Sparse column marked as nullable');
  }

  // 4. Duplicate Headers Collision Safety
  {
    const csvContent = 'Revenue,Expenses,Revenue\n1000,500,1200\n2000,800,2400';
    const buffer = Buffer.from(csvContent, 'utf-8');
    const dataset = await ingestFile({
      fileName: 'duplicates.csv',
      fileSize: buffer.length,
      buffer,
    });

    const cols = dataset.tables[0].columns;
    assert(cols.length === 3, 'Duplicate headers preserve all 3 columns');
    assert(cols[0].id !== cols[2].id, 'Duplicate headers have unique internal IDs', `${cols[0].id} vs ${cols[2].id}`);
    assert(dataset.tables[0].rows[0][0] === '1000' && dataset.tables[0].rows[0][2] === '1200', 'Duplicate column values do not overwrite each other');
  }

  // 5. UTF-8 BOM Handling
  {
    const bomBuffer = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from('City,Population\nTokyo,37000000\nDelhi,32000000', 'utf-8')]);
    const dataset = await ingestFile({
      fileName: 'bom_data.csv',
      fileSize: bomBuffer.length,
      buffer: bomBuffer,
    });

    assert(dataset.tables[0].columns[0].name === 'City', 'BOM stripped cleanly from first header');
    assert(dataset.extraction.warnings.some((w) => w.includes('BOM')), 'BOM logged as extraction warning');
  }

  // 6. Inconsistent / Irregular Row Lengths
  {
    const csvContent = 'ColA,ColB,ColC\n1,2,3\n4,5\n6,7,8,9';
    const buffer = Buffer.from(csvContent, 'utf-8');
    const dataset = await ingestFile({
      fileName: 'inconsistent.csv',
      fileSize: buffer.length,
      buffer,
    });

    assert(dataset.tables[0].rows[1].length === 3, 'Short row padded to match column count');
    assert(dataset.tables[0].rows[1][2] === null, 'Missing cell in short row is null');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST GROUP 2: XLSX INGESTION
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n📊 Group 2: XLSX Ingestion');

  // 1. Single Sheet Workbook
  {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['Department', 'Headcount', 'Active'],
      ['Engineering', 45, true],
      ['Marketing', 18, true],
      ['Finance', 12, false],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'Departments');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const dataset = await ingestFile({
      fileName: 'company.xlsx',
      fileSize: buffer.length,
      buffer,
    });

    assert(dataset.tables.length === 1, 'Single sheet workbook creates 1 table');
    assert(dataset.tables[0].name === 'Departments', 'Sheet name preserved as table name');
    assert(dataset.tables[0].columns[1].inferredType === 'integer', 'Headcount inferred as integer');
    assert(dataset.tables[0].columns[2].inferredType === 'boolean', 'Active inferred as boolean');
  }

  // 2. Multi-Sheet Workbook with Empty Sheet Filtering
  {
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet([
      ['Month', 'Revenue'],
      ['Jan', 10000],
      ['Feb', 12000],
    ]);
    const ws2 = XLSX.utils.aoa_to_sheet([]); // Empty sheet
    const ws3 = XLSX.utils.aoa_to_sheet([
      ['Region', 'Growth'],
      ['East', '14.5%'],
      ['West', '8.2%'],
    ]);
    XLSX.utils.book_append_sheet(wb, ws1, 'Financials');
    XLSX.utils.book_append_sheet(wb, ws2, 'BlankSheet');
    XLSX.utils.book_append_sheet(wb, ws3, 'RegionalGrowth');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const dataset = await ingestFile({
      fileName: 'multi_sheet.xlsx',
      fileSize: buffer.length,
      buffer,
    });

    assert(dataset.tables.length === 2, 'Multi-sheet workbook created 2 tables (empty sheet skipped)');
    assert(dataset.tables[0].name === 'Financials', 'First table name matches first usable sheet');
    assert(dataset.tables[1].name === 'RegionalGrowth', 'Second table name matches third usable sheet');
    assert(dataset.tables[1].columns[1].inferredType === 'percentage', 'Percentage formatted cells inferred');
    assert(dataset.extraction.warnings.some((w) => w.includes('BlankSheet')), 'Empty sheet skipped warning recorded');
  }

  // 3. Date & Currency Handling in XLSX
  {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['Tx Date', 'Amount', 'Fee Rate'],
      ['2026-03-01', '$1,250.00', '2.5%'],
      ['2026-03-02', '$840.50', '2.5%'],
      ['2026-03-03', '$3,120.00', '1.8%'],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const dataset = await ingestFile({
      fileName: 'transactions.xlsx',
      fileSize: buffer.length,
      buffer,
    });

    assert(dataset.tables[0].columns[0].inferredType === 'date', 'Date string inferred as date');
    assert(dataset.tables[0].columns[1].inferredType === 'currency', 'USD string inferred as currency');
    assert(dataset.tables[0].columns[2].inferredType === 'percentage', 'Rate inferred as percentage');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST GROUP 3: EQUIVALENCE TEST (CSV vs XLSX)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n⚖️ Group 3: Equivalence Test (CSV vs XLSX)');
  {
    // CSV
    const csvContent = 'Quarter,Revenue,Profit Margin\nQ1,150000,12.5%\nQ2,185000,14.2%\nQ3,210000,15.8%';
    const csvBuffer = Buffer.from(csvContent, 'utf-8');
    const csvDataset = await ingestFile({
      fileName: 'report.csv',
      fileSize: csvBuffer.length,
      buffer: csvBuffer,
    });

    // Equivalent XLSX
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['Quarter', 'Revenue', 'Profit Margin'],
      ['Q1', 150000, '12.5%'],
      ['Q2', 185000, '14.2%'],
      ['Q3', 210000, '15.8%'],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'report');
    const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const xlsxDataset = await ingestFile({
      fileName: 'report.xlsx',
      fileSize: xlsxBuffer.length,
      buffer: xlsxBuffer,
    });

    const csvTable = csvDataset.tables[0];
    const xlsxTable = xlsxDataset.tables[0];

    assert(csvTable.rowCount === xlsxTable.rowCount, 'Equivalent row count (3 == 3)');
    assert(csvTable.columnCount === xlsxTable.columnCount, 'Equivalent column count (3 == 3)');
    assert(
      csvTable.columns[1].inferredType === xlsxTable.columns[1].inferredType,
      `Equivalent Revenue type inference (${csvTable.columns[1].inferredType} == ${xlsxTable.columns[1].inferredType})`
    );
    assert(
      csvTable.columns[2].inferredType === xlsxTable.columns[2].inferredType,
      `Equivalent Margin type inference (${csvTable.columns[2].inferredType} == ${xlsxTable.columns[2].inferredType})`
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST GROUP 4: DETERMINISTIC TYPE INFERENCE ENGINE
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n🔬 Group 4: Deterministic Type Inference Rules');
  {
    assert(classifyValue('true') === 'boolean', 'classifyValue("true") is boolean');
    assert(classifyValue('125') === 'integer', 'classifyValue("125") is integer');
    assert(classifyValue('125.55') === 'number', 'classifyValue("125.55") is number');
    assert(classifyValue('$250.10') === 'currency', 'classifyValue("$250.10") is currency');
    assert(classifyValue('₹12,500') === 'currency', 'classifyValue("₹12,500") is currency');
    assert(classifyValue('47%') === 'percentage', 'classifyValue("47%") is percentage');
    assert(classifyValue('2026-04-13') === 'date', 'classifyValue("2026-04-13") is date');
    assert(classifyValue('2026-04-13T10:42:00Z') === 'datetime', 'classifyValue("2026-04-13T10:42:00Z") is datetime');
    assert(classifyValue('Acme Corp') === 'string', 'classifyValue("Acme Corp") is string');

    // Conservative column threshold
    const mostlyInts = ['10', '20', '30', '40', 'invalid', '50', '60', '70', '80', '90']; // 90% integer
    assert(inferColumnType(mostlyInts) === 'integer', 'Column with 90% integers infers as integer');

    const mixed5050 = ['10', '20', 'abc', 'def']; // 50% int, 50% str
    assert(inferColumnType(mixed5050) === 'string', 'Column below 85% threshold conservatively falls back to string');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST GROUP 5: VALIDATION & ERROR HANDLING
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n🛡️ Group 5: Validation & Error Handling');

  // 1. Empty File
  try {
    await ingestFile({
      fileName: 'empty.csv',
      fileSize: 0,
      buffer: Buffer.alloc(0),
    });
    assert(false, 'Empty file should throw EMPTY_FILE error');
  } catch (err) {
    assert(err instanceof IngestionError && err.code === 'EMPTY_FILE', 'Throws EMPTY_FILE on 0-byte upload');
  }

  // 2. Unsupported Extension
  try {
    await ingestFile({
      fileName: 'script.exe',
      fileSize: 100,
      buffer: Buffer.from('echo hello'),
    });
    assert(false, 'Unsupported extension should throw UNSUPPORTED_FILE_TYPE error');
  } catch (err) {
    assert(
      err instanceof IngestionError && err.code === 'UNSUPPORTED_FILE_TYPE',
      'Throws UNSUPPORTED_FILE_TYPE on .exe file'
    );
  }

  // 3. Oversized File (> 50MB)
  try {
    await ingestFile({
      fileName: 'huge.csv',
      fileSize: 55 * 1024 * 1024,
      buffer: Buffer.alloc(10),
    });
    assert(false, 'Oversized file should throw FILE_TOO_LARGE error');
  } catch (err) {
    assert(
      err instanceof IngestionError && err.code === 'FILE_TOO_LARGE',
      'Throws FILE_TOO_LARGE on files exceeding 50MB'
    );
  }

  // 4. Corrupt Workbook (XLSX with non-ZIP bytes)
  try {
    await ingestFile({
      fileName: 'corrupt.xlsx',
      fileSize: 50,
      buffer: Buffer.from('this is just plain text, not a zip or excel file'),
    });
    assert(false, 'Corrupt XLSX should throw INVALID_FILE error');
  } catch (err) {
    assert(
      err instanceof IngestionError && (err.code === 'INVALID_FILE' || err.code === 'PARSE_FAILED'),
      'Throws INVALID_FILE on corrupt/spoofed XLSX file'
    );
  }

  // 5. Zero-Trace Processing Mode Check
  {
    const csvContent = 'SecretCol,SecretMetric\nA,100\nB,200';
    const buffer = Buffer.from(csvContent, 'utf-8');
    const dataset = await ingestFile({
      fileName: 'classified.csv',
      fileSize: buffer.length,
      buffer,
      mode: 'zerotrace',
    });

    assert(dataset.processingMode === 'zerotrace', 'Zero-Trace mode correctly recorded in canonical dataset');
    assert(dataset.source.mode === 'zerotrace', 'Zero-Trace mode preserved in source metadata');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST GROUP 6: PHASE 2A.2 — ERROR CODE COVERAGE
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n📋 Group 6: Phase 2A.2 Error Code Coverage');

  // Test 1: All new error codes are valid IngestionErrorCode values
  {
    const newCodes: IngestionErrorCode[] = [
      'OCR_REQUIRED',
      'NO_USABLE_TABULAR_DATA',
      'DOCUMENT_PARSE_FAILED',
    ];

    assert(
      newCodes.every((c) => typeof c === 'string' && c.length > 0),
      'New error codes are valid non-empty strings'
    );

    // Validate IngestionError can be constructed with new codes
    for (const code of newCodes) {
      const err = new IngestionError(code, `Test error for ${code}`, 422, false);
      assert(err.code === code, `IngestionError can be constructed with code=${code}`);
      assert(err.toResponse().code === code, `IngestionError.toResponse() returns code=${code}`);
    }
  }

  // Test 2: OCR_REQUIRED error is non-recoverable (user must act)
  {
    const err = new IngestionError('OCR_REQUIRED', 'Scanned PDF detected.', 422, false);
    assert(err.recoverable === false, 'OCR_REQUIRED is non-recoverable');
    assert(err.statusCode === 422, 'OCR_REQUIRED has status 422');
  }

  // Test 3: NO_USABLE_TABULAR_DATA error is recoverable (user can try different file)
  {
    const err = new IngestionError('NO_USABLE_TABULAR_DATA', 'No tables found.', 422, true);
    assert(err.recoverable === true, 'NO_USABLE_TABULAR_DATA is recoverable');
  }

  // Test 4: DOCUMENT_PARSE_FAILED with details object
  {
    const err = new IngestionError(
      'DOCUMENT_PARSE_FAILED',
      'Parse error',
      422,
      true,
      { detail: 'Encrypted PDF' }
    );
    const response = err.toResponse();
    assert(response.details?.detail === 'Encrypted PDF', 'DOCUMENT_PARSE_FAILED includes details');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST GROUP 7: PHASE 2A.2 — DATASET TYPE SHAPE TESTS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n📋 Group 7: Dataset Type Shape Tests');

  // Test: VizPilotDataset can carry optional document field
  {
    const mockDataset: VizPilotDataset = {
      id: 'ds_test',
      name: 'Test',
      source: { fileName: 'test.pdf', fileSize: 1024, fileType: 'pdf', mimeType: 'application/pdf', uploadedAt: new Date().toISOString(), mode: 'zerotrace' },
      tables: [],
      extraction: {
        method: 'document-text',
        durationMs: 100,
        confidence: 0.8,
        warnings: [],
        pagesProcessed: 3,
        textBlocksDetected: 12,
        tablesDetected: 0,
      },
      createdAt: new Date().toISOString(),
      processingMode: 'zerotrace',
      document: {
        textBlocks: [
          { id: 'blk0', role: 'heading', text: 'Executive Summary', pageNumber: 1 },
          { id: 'blk1', role: 'paragraph', text: 'Q3 results were strong.', pageNumber: 1 },
        ],
        pageCount: 3,
        hasDetectedTables: false,
        ocrLikely: false,
      },
    };

    assert(mockDataset.document !== undefined, 'VizPilotDataset.document field is present');
    assert(mockDataset.document!.textBlocks.length === 2, 'Document has 2 text blocks');
    assert(mockDataset.document!.textBlocks[0].role === 'heading', 'First block role is heading');
    assert(mockDataset.extraction.method === 'document-text', 'Extraction method is document-text');
    assert(mockDataset.extraction.pagesProcessed === 3, 'pagesProcessed is 3');
    assert(mockDataset.extraction.textBlocksDetected === 12, 'textBlocksDetected is 12');
    assert(mockDataset.extraction.tablesDetected === 0, 'tablesDetected is 0');
  }

  // Test: ExtractionMethod union exhaustiveness
  {
    const allMethods: ExtractionMethod[] = ['structured', 'document-table', 'document-text', 'mixed'];
    assert(allMethods.length === 4, 'ExtractionMethod has 4 variants');
  }

  // Test: VizPilotTextBlock role values
  {
    const roles: VizPilotTextBlock['role'][] = ['heading', 'paragraph', 'list-item', 'caption', 'unknown'];
    assert(roles.length === 5, 'TextBlockRole has 5 variants');
  }

  // Test: VizPilotDocumentContent structure
  {
    const doc: VizPilotDocumentContent = {
      textBlocks: [],
      pageCount: 0,
      hasDetectedTables: false,
      ocrLikely: false,
    };
    assert(Array.isArray(doc.textBlocks), 'VizPilotDocumentContent.textBlocks is array');
    assert(typeof doc.ocrLikely === 'boolean', 'VizPilotDocumentContent.ocrLikely is boolean');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST GROUP 8: PHASE 2A.2 — PROFILING CONTRACT SHAPE TESTS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n📋 Group 8: Profiling Contract Shape Tests');

  // Test: VizPilotDataProfile can be constructed from the type contract
  {
    const quality: VizPilotDataQuality = {
      overallScore: 0.92,
      avgCompletenessRate: 0.95,
      avgTypeConsistencyRate: 0.98,
      hasHighNullColumns: false,
      hasHighDuplicateRows: false,
    };

    const relationship: VizPilotRelationship = {
      kind: 'primary-key',
      fromTableId: 'tbl_0',
      fromColumnId: 'col_0_id',
      toTableId: 'tbl_0',
      toColumnId: 'col_0_id',
      confidence: 0.99,
    };

    const warning: ProfileWarning = {
      level: 'warning',
      code: 'HIGH_NULL_RATE',
      message: 'Column "Revenue" has 65% null values.',
      tableId: 'tbl_0',
      columnId: 'col_1_revenue',
    };

    const profile: VizPilotDataProfile = {
      datasetId: 'ds_test',
      profiledAt: new Date().toISOString(),
      engineVersion: '2A.2',
      summary: {
        tableCount: 0,
        totalRows: 0,
        totalColumns: 0,
        numericColumns: 0,
        categoricalColumns: 0,
        temporalColumns: 0,
        booleanColumns: 0,
        unknownColumns: 0,
        emptyColumns: 0,
        constantColumns: 0,
      },
      tables: [],
      quality,
      relationships: [relationship],
      warnings: [warning],
      durationMs: 42,
    };

    assert(typeof profile.datasetId === 'string', 'VizPilotDataProfile.datasetId is string');
    assert(Array.isArray(profile.tables), 'VizPilotDataProfile.tables is array');
    assert(profile.quality.overallScore === 0.92, 'VizPilotDataQuality.overallScore is correct');
    assert(profile.relationships[0].kind === 'primary-key', 'VizPilotRelationship.kind is primary-key');
    assert(profile.warnings[0].level === 'warning', 'ProfileWarning.level is warning');
    assert(profile.warnings[0].code === 'HIGH_NULL_RATE', 'ProfileWarning.code is HIGH_NULL_RATE');
  }

  // Test: SemanticRole union values
  {
    const roles: SemanticRole[] = [
      'identifier', 'category', 'measure', 'timestamp', 'label',
      'boolean-flag', 'currency-amount', 'percentage', 'geolocation',
      'email', 'url', 'unknown',
    ];
    assert(roles.length === 12, 'SemanticRole has 12 variants');
  }

  // Test: VizPilotColumnProfile structure shape
  {
    const colProfile: VizPilotColumnProfile = {
      columnId: 'col_0_revenue',
      name: 'Revenue',
      index: 0,
      inferredType: 'currency',
      semanticRole: 'measure',
      statistics: {
        kind: 'numeric',
        stats: {
          min: 100,
          max: 500000,
          mean: 42000,
          median: 38000,
          q1: 20000,
          q3: 45000,
          stdDev: 12000,
          sum: 4200000,
          zeroCount: 0,
          negativeCount: 0,
          distinctCount: 100,
          histogram: {
            bins: [100, 250000, 500000],
            counts: [80, 20],
            binWidth: 249950,
          },
        },
      },
      quality: {
        nullCount: 0,
        nullRate: 0.0,
        uniqueCount: 100,
        uniquenessRate: 1.0,
        typeConsistencyRate: 1.0,
        isConstant: false,
        isAllNull: false,
      },
      sampleValues: [100, 200, 300],
    };


    assert(colProfile.semanticRole === 'measure', 'VizPilotColumnProfile.semanticRole is measure');
    assert(colProfile.statistics.kind === 'numeric', 'Column statistics kind is numeric');
    assert(colProfile.quality.nullRate === 0.0, 'Column quality nullRate is 0.0');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST GROUP 9: CSV/XLSX REGRESSION GUARD
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n📋 Group 9: CSV/XLSX Regression Guard');

  // Verify that CSV ingestion still works identically to Phase 2A.1
  {
    const csvContent = 'Category,Sales,Margin\nNorth,125000,0.34\nSouth,98000,0.28\nEast,143000,0.41';
    const buffer = Buffer.from(csvContent, 'utf-8');
    const dataset = await ingestFile({
      fileName: 'regression_csv.csv',
      fileSize: buffer.length,
      buffer,
      mode: 'workspace',
    });

    assert(dataset.tables.length === 1, 'REGRESSION: CSV still creates 1 table');
    assert(dataset.tables[0].rowCount === 3, 'REGRESSION: CSV row count unchanged');
    assert(dataset.tables[0].columnCount === 3, 'REGRESSION: CSV column count unchanged');
    assert(dataset.extraction.method === 'structured', 'REGRESSION: CSV extraction method is structured');
    assert(dataset.document === undefined, 'REGRESSION: CSV has no document field');
    assert(dataset.extraction.pagesProcessed === undefined, 'REGRESSION: CSV has no pagesProcessed');
    assert(dataset.extraction.tablesDetected === undefined, 'REGRESSION: CSV has no tablesDetected');
  }

  // Verify that XLSX ingestion still works identically to Phase 2A.1
  {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['Product', 'Units', 'Price'],
      ['Widget A', 500, 14.99],
      ['Widget B', 320, 24.99],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');
    const xlsxBuffer = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
    const dataset = await ingestFile({
      fileName: 'regression_xlsx.xlsx',
      fileSize: xlsxBuffer.length,
      buffer: xlsxBuffer,
      mode: 'workspace',
    });

    assert(dataset.tables.length === 1, 'REGRESSION: XLSX still creates 1 table');
    assert(dataset.tables[0].rowCount === 2, 'REGRESSION: XLSX row count unchanged');
    assert(dataset.extraction.method === 'structured', 'REGRESSION: XLSX extraction method is structured');
    assert(dataset.document === undefined, 'REGRESSION: XLSX has no document field');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST GROUP 10: CONFIG CONSTANTS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n📋 Group 10: Config Constants');

  {
    const { INGESTION_CONFIG } = await import('../src/lib/ingestion/validator');

    assert(INGESTION_CONFIG.MAX_UPLOAD_BYTES === 50 * 1024 * 1024, 'MAX_UPLOAD_BYTES is 50MB');
    assert(INGESTION_CONFIG.MAX_INTERACTIVE_ROWS === 100_000, 'MAX_INTERACTIVE_ROWS is 100,000');
    assert(INGESTION_CONFIG.MAX_CLIENT_RESPONSE_SIZE === 4 * 1024 * 1024, 'MAX_CLIENT_RESPONSE_SIZE is 4MB');
    assert(INGESTION_CONFIG.MAX_PREVIEW_ROWS === 500, 'MAX_PREVIEW_ROWS is 500');
  }

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});

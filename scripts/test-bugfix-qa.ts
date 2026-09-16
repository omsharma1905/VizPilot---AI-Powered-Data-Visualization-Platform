/**
 * Bugfix Verification Suite — Phase 2F Post-Integration QA
 *
 * Tests:
 * - Recommendation Score Differentiation & Monotonicity
 * - Candidate Diversity & Unique Card Fit Scores
 * - PDF Parsing, Scanned PDF OCR Detection, Corrupt/Invalid Detection
 */

import fs from 'fs';
import { profileDataset } from '@/src/lib/profiling';
import { generateCandidates } from '@/src/lib/ai/candidates/generator';
import { createDeterministicFallback } from '@/src/lib/ai/fallback';
import { calculateCandidateScore, calibrateConfidence } from '@/src/lib/ai/scoring/visualization';
import { CHART_TAXONOMY } from '@/src/lib/ai/candidates/taxonomy';
import { PDFAdapter } from '@/src/lib/ingestion/adapters/pdf';
import { IngestionError } from '@/src/lib/ingestion/errors';
import type { VizPilotDataset, DataValue } from '@/src/types/dataset';

function makeMockDataset(name: string, cols: Array<{ name: string; type: any; values: DataValue[] }>): VizPilotDataset {
  const rowCount = cols[0].values.length;
  return {
    id: `ds_${name.toLowerCase()}`,
    name,
    source: {
      fileName: `${name}.csv`,
      fileSize: 500,
      fileType: 'csv',
      mimeType: 'text/csv',
      uploadedAt: new Date().toISOString(),
      mode: 'zerotrace',
    },
    tables: [{
      id: `tbl_${name.toLowerCase()}`,
      name,
      rowCount,
      columnCount: cols.length,
      columns: cols.map((c, i) => ({
        id: `col_${i}_${c.name.toLowerCase()}`,
        name: c.name,
        index: i,
        inferredType: c.type,
        sampleValues: c.values.slice(0, 5),
        nullable: false,
        nullCount: 0,
        totalCount: rowCount,
      })),
      rows: Array.from({ length: rowCount }, (_, r) => cols.map(c => c.values[r])),
    }],
    extraction: { method: 'structured', durationMs: 1, confidence: 1, warnings: [] },
    createdAt: new Date().toISOString(),
    processingMode: 'zerotrace',
  };
}

async function runBugfixTestSuite() {
  console.log('==================================================');
  console.log('VIZPILOT — RECOMMENDATION & PDF BUGFIX QA SUITE');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
      failed++;
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PART 1: RECOMMENDATION SCORE & CONFIDENCE VERIFICATION
  // ───────────────────────────────────────────────────────────────────────────
  console.log('1. Recommendation Score Differentiation & Confidence:');

  // Test 1: Multi-measure dataset does NOT collapse all cards to 71%
  const multiMeasureDs = makeMockDataset('Employees', [
    { name: 'Department', type: 'string', values: ['Sales', 'Engineering', 'Marketing', 'Finance', 'HR'] },
    { name: 'Salary', type: 'number', values: [70000, 120000, 65000, 85000, 60000] },
    { name: 'Bonus', type: 'number', values: [15000, 20000, 10000, 18000, 8000] },
    { name: 'Experience', type: 'number', values: [5, 8, 4, 6, 3] },
    { name: 'Rating', type: 'number', values: [4, 5, 4, 4, 3] },
    { name: 'Headcount', type: 'integer', values: [12, 25, 8, 10, 5] },
  ]);

  const profile = profileDataset(multiMeasureDs);
  const candidates = generateCandidates(profile);
  const rec = createDeterministicFallback(profile, candidates, 'Test fallback', performance.now());
  const allCards = [rec.primary, ...rec.alternatives];
  const confidences = allCards.map((c) => Math.round(c.confidence * 100));

  assert(
    new Set(confidences).size > 1,
    'Multiple recommendations do not all receive the same confidence accidentally',
    `Got confidences: ${confidences.join('%, ')}%`
  );

  assert(
    !confidences.every((c) => c === 71),
    'Confidences do not all collapse to 71%',
    `Got confidences: ${confidences.join('%, ')}%`
  );

  // Test 2: Confidence is deterministic
  const rec2 = createDeterministicFallback(profile, candidates, 'Test fallback', performance.now());
  const confs2 = [rec2.primary, ...rec2.alternatives].map((c) => Math.round(c.confidence * 100));
  assert(
    JSON.stringify(confidences) === JSON.stringify(confs2),
    'Confidence computation is strictly deterministic across identical runs'
  );

  // Test 3: Raw scores 0.91, 0.86, 0.79, 0.72, 0.64 do not collapse to 71%
  const topConf = calibrateConfidence(91, 86);
  assert(topConf > 0.75, `Top score 91 yields strong confidence (got ${topConf})`);

  // Test 4: Monotonic descent: rank 1 >= rank 2 >= rank 3 >= rank 4 >= rank 5
  let monotonic = true;
  for (let i = 0; i < confidences.length - 1; i++) {
    if (confidences[i] < confidences[i + 1]) monotonic = false;
  }
  assert(monotonic, 'Recommendation confidences descend monotonically with candidate quality');

  // Test 5: Candidate taxonomy preserves distinct labels
  assert(CHART_TAXONOMY['bar'].label === 'Vertical Bar Chart', 'Bar is labeled Vertical Bar Chart');
  assert(CHART_TAXONOMY['horizontal_bar'].label === 'Horizontal Bar Chart', 'Horizontal Bar is labeled Horizontal Bar Chart');
  assert(CHART_TAXONOMY['grouped_bar'].label === 'Grouped Bar Chart', 'Grouped Bar is labeled Grouped Bar Chart');
  assert(CHART_TAXONOMY['stacked_bar'].label === 'Stacked Bar Chart', 'Stacked Bar is labeled Stacked Bar Chart');
  assert(CHART_TAXONOMY['line'].label === 'Line Chart', 'Line is labeled Line Chart');

  // Test 6: Stable IDs exist for duplicate chart types (prevents duplicate React keys)
  const candidateIds = allCards.map((c) => c.candidateId);
  assert(
    new Set(candidateIds).size === allCards.length,
    'Each recommendation card has a unique candidateId (React key safe)'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // PART 2: PDF INGESTION & ERROR TAXONOMY
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n2. PDF Ingestion & Error Taxonomy:');

  const pdfAdapter = new PDFAdapter();

  // Test 1: Corrupt PDF (missing %PDF- signature) throws INVALID_FILE
  try {
    const corruptBuf = Buffer.from('NOT_A_PDF_DOCUMENT_CONTENT');
    await pdfAdapter.extract(corruptBuf, {
      fileName: 'corrupt.pdf',
      fileSize: corruptBuf.length,
      fileType: 'pdf',
      mimeType: 'application/pdf',
      uploadedAt: new Date().toISOString(),
      mode: 'zerotrace',
    });
    assert(false, 'Corrupt PDF should throw');
  } catch (err: any) {
    assert(err instanceof IngestionError && err.code === 'INVALID_FILE', 'Corrupt PDF without %PDF- header throws INVALID_FILE');
    assert(err.recoverable === false, 'INVALID_FILE is non-recoverable');
    assert(!err.userMessage.includes('corrupted or encrypted'), 'Error message is clear and specific');
  }

  // Test 2: Real AdmitCard.pdf case
  const admitCardPath = 'C:/Users/OM SHARMA/Downloads/AdmitCard.pdf';
  if (fs.existsSync(admitCardPath)) {
    const admitBuf = fs.readFileSync(admitCardPath);
    try {
      await pdfAdapter.extract(admitBuf, {
        fileName: 'AdmitCard.pdf',
        fileSize: admitBuf.length,
        fileType: 'pdf',
        mimeType: 'application/pdf',
        uploadedAt: new Date().toISOString(),
        mode: 'zerotrace',
      });
      assert(false, 'AdmitCard.pdf (scanned) should throw OCR_REQUIRED');
    } catch (err: any) {
      assert(err instanceof IngestionError, 'AdmitCard.pdf throws IngestionError');
      assert(err.code === 'OCR_REQUIRED', 'AdmitCard.pdf is recognized as scanned PDF (OCR_REQUIRED)');
      assert(err.userMessage.includes('scanned image PDF'), 'User message clearly states scanned image PDF');
      assert(!err.userMessage.includes('corrupted or encrypted'), 'Does NOT falsely claim file is corrupted or encrypted');
      assert(err.recoverable === false, 'OCR_REQUIRED is non-recoverable without searchable text');
    }
  } else {
    console.log('  ⚠️ Skipping live AdmitCard.pdf test (file not in Downloads)');
  }

  // Test 3: Valid minimal text PDF
  const textPdf = `%PDF-1.3
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 130 >> stream
BT
/F1 12 Tf
72 712 Td
(Month   Revenue   Expenses   Profit) Tj
0 -20 Td
(Jan     10000     6000       4000) Tj
0 -20 Td
(Feb     12000     7000       5000) Tj
0 -20 Td
(Mar     15000     8000       7000) Tj
ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000427 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
498
%%EOF`;

  try {
    const validBuf = Buffer.from(textPdf, 'utf-8');
    const result = await pdfAdapter.extract(validBuf, {
      fileName: 'report.pdf',
      fileSize: validBuf.length,
      fileType: 'pdf',
      mimeType: 'application/pdf',
      uploadedAt: new Date().toISOString(),
      mode: 'zerotrace',
    });
    assert(result.documentContent !== undefined, 'Valid text PDF extracts document content');
    assert((result.pagesProcessed ?? 0) >= 1, 'Valid text PDF processes pages');
  } catch (err: any) {
    assert(false, `Valid text PDF should parse successfully: ${err.message}`);
  }

  console.log('\n==================================================');
  console.log(`TOTAL BUGFIX TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('==================================================\n');

  if (failed > 0) process.exit(1);
}

runBugfixTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

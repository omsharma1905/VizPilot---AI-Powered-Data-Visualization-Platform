// ─── Chart & Visualization Types ────────────────────────────────────────────

export type ChartType =
  | 'bar'
  | 'horizontal_bar'
  | 'grouped_bar'
  | 'stacked_bar'
  | 'line'
  | 'area'
  | 'scatter'
  | 'pie'
  | 'donut'
  | 'histogram'
  | 'kpi_card'
  | 'heatmap'
  | 'funnel'
  | 'radar'
  | 'treemap';


export interface AxisConfig {
  field: string;
  label?: string;
  format?: 'number' | 'currency' | 'percent' | 'date';
}

export interface VisualizationConfig {
  id: string;
  title: string;
  chartType: ChartType;
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  groupBy?: string;
  colorField?: string;
  filters?: Record<string, string | number | boolean>;
  description?: string;
}

// ─── Data Types ──────────────────────────────────────────────────────────────

export type FieldType = 'string' | 'number' | 'date' | 'boolean' | 'category';

export interface DataField {
  key: string;
  label: string;
  type: FieldType;
  unit?: string;
  description?: string;
}

export type DataRow = Record<string, string | number | boolean | null>;

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  fields: DataField[];
  rows: DataRow[];
  createdAt: string;
  rowCount: number;
  source?: 'csv' | 'xlsx' | 'pdf' | 'docx' | 'mock';
}

// ─── Theme Types ─────────────────────────────────────────────────────────────

export type ThemeMode = 'dark' | 'light';

// ─── Privacy Mode ─────────────────────────────────────────────────────────────

export type PrivacyMode = 'workspace' | 'zerotrace';

// ─── Upload / Flow Types ─────────────────────────────────────────────────────

export type FlowStage =
  | 'upload'
  | 'analysis'
  | 'recommendation'
  | 'visualize'
  | 'dashboard';

export interface FlowStep {
  stage: FlowStage;
  label: string;
  href: string;
  completed: boolean;
  active: boolean;
}

// ─── Chart Recommendation ────────────────────────────────────────────────────

export interface ChartRecommendation {
  id?: string;
  chartType: ChartType;
  confidence: number; // 0–1
  rationale: string;
  label: string;
}

// ─── Ingestion & Canonical Dataset Contracts ─────────────────────────────────
export * from './dataset';

// ─── Data Profiling Contracts (Phase 2B implementation) ──────────────────────
export * from './profiling';

// ─── Visualization Intelligence Contracts (Phase 2C implementation) ──────────
export * from '@/src/lib/ai/types';

// ─── Authentication Contracts (Phase 3A implementation) ──────────────────────
export * from './auth';


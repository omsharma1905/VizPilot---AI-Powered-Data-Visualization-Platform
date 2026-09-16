import type { Dataset, ChartRecommendation } from '@/src/types';

// ─── Q3 Business Performance Dataset ─────────────────────────────────────────

export const q3BusinessDataset: Dataset = {
  id: 'q3-business-performance',
  name: 'Q3 Business Performance',
  description:
    'Quarterly breakdown of revenue, expenses, and customer acquisition across regions and product lines.',
  source: 'mock',
  createdAt: '2024-09-01T00:00:00Z',
  rowCount: 18,
  fields: [
    { key: 'month', label: 'Month', type: 'date' },
    { key: 'revenue', label: 'Revenue', type: 'number', unit: 'USD' },
    { key: 'expenses', label: 'Expenses', type: 'number', unit: 'USD' },
    { key: 'customers', label: 'Customers', type: 'number' },
    { key: 'region', label: 'Region', type: 'category' },
    { key: 'product', label: 'Product', type: 'category' },
  ],
  rows: [
    { month: 'Jul', revenue: 420000, expenses: 310000, customers: 1240, region: 'North America', product: 'Analytics Pro' },
    { month: 'Jul', revenue: 185000, expenses: 140000, customers: 580, region: 'Europe', product: 'Analytics Pro' },
    { month: 'Jul', revenue: 95000, expenses: 78000, customers: 310, region: 'Asia Pacific', product: 'Analytics Lite' },
    { month: 'Aug', revenue: 468000, expenses: 325000, customers: 1380, region: 'North America', product: 'Analytics Pro' },
    { month: 'Aug', revenue: 210000, expenses: 155000, customers: 640, region: 'Europe', product: 'Analytics Pro' },
    { month: 'Aug', revenue: 112000, expenses: 85000, customers: 360, region: 'Asia Pacific', product: 'Analytics Lite' },
    { month: 'Sep', revenue: 512000, expenses: 340000, customers: 1520, region: 'North America', product: 'Analytics Pro' },
    { month: 'Sep', revenue: 248000, expenses: 172000, customers: 710, region: 'Europe', product: 'Analytics Pro' },
    { month: 'Sep', revenue: 134000, expenses: 92000, customers: 420, region: 'Asia Pacific', product: 'Analytics Lite' },
    { month: 'Jul', revenue: 68000, expenses: 52000, customers: 210, region: 'North America', product: 'Analytics Lite' },
    { month: 'Jul', revenue: 34000, expenses: 28000, customers: 95, region: 'Europe', product: 'Analytics Lite' },
    { month: 'Aug', revenue: 74000, expenses: 57000, customers: 235, region: 'North America', product: 'Analytics Lite' },
    { month: 'Aug', revenue: 38000, expenses: 30000, customers: 108, region: 'Europe', product: 'Analytics Lite' },
    { month: 'Sep', revenue: 82000, expenses: 61000, customers: 268, region: 'North America', product: 'Analytics Lite' },
    { month: 'Sep', revenue: 44000, expenses: 34000, customers: 124, region: 'Europe', product: 'Analytics Lite' },
    { month: 'Jul', revenue: 156000, expenses: 118000, customers: 445, region: 'North America', product: 'Enterprise' },
    { month: 'Aug', revenue: 178000, expenses: 128000, customers: 490, region: 'North America', product: 'Enterprise' },
    { month: 'Sep', revenue: 198000, expenses: 138000, customers: 540, region: 'North America', product: 'Enterprise' },
  ],
};

// ─── Mock chart recommendations for this dataset ─────────────────────────────

export const q3Recommendations: ChartRecommendation[] = [
  {
    chartType: 'bar',
    confidence: 0.92,
    rationale: 'Revenue vs. Expenses by month shows clear comparative trends best represented as grouped bars.',
    label: 'Revenue vs. Expenses',
  },
  {
    chartType: 'line',
    confidence: 0.87,
    rationale: 'Customer growth over the quarter is a time series — a line chart communicates trajectory most clearly.',
    label: 'Customer Growth',
  },
  {
    chartType: 'pie',
    confidence: 0.78,
    rationale: 'Revenue share by region reveals proportion of contribution across markets.',
    label: 'Revenue by Region',
  },
  {
    chartType: 'area',
    confidence: 0.74,
    rationale: 'Cumulative revenue by product over time shows volume accumulation effectively.',
    label: 'Revenue by Product (Area)',
  },
  {
    chartType: 'scatter',
    confidence: 0.65,
    rationale: 'Customers vs. Revenue correlation may reveal outlier markets or high-performing segments.',
    label: 'Revenue × Customer Correlation',
  },
];

// ─── Aggregate helpers ────────────────────────────────────────────────────────

export const monthlyRevenue = ['Jul', 'Aug', 'Sep'].map((month) => ({
  month,
  revenue: q3BusinessDataset.rows
    .filter((r) => r.month === month)
    .reduce((sum, r) => sum + (r.revenue as number), 0),
  expenses: q3BusinessDataset.rows
    .filter((r) => r.month === month)
    .reduce((sum, r) => sum + (r.expenses as number), 0),
  customers: q3BusinessDataset.rows
    .filter((r) => r.month === month)
    .reduce((sum, r) => sum + (r.customers as number), 0),
}));

export const revenueByRegion = ['North America', 'Europe', 'Asia Pacific'].map((region) => ({
  region,
  revenue: q3BusinessDataset.rows
    .filter((r) => r.region === region)
    .reduce((sum, r) => sum + (r.revenue as number), 0),
}));

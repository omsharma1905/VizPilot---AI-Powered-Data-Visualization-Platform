'use client';

import { cn } from '@/src/lib/utils/cn';
import { ChartRenderer } from '@/src/components/charts/ChartRenderer';
import type { VisualizationConfig } from '@/src/types';

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function ChartSkeleton({ height }: { height: number | string }) {
  return (
    <div
      className="animate-pulse rounded-lg bg-surface"
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    />
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function ChartEmpty() {
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center rounded-lg border border-dashed border-border">
      <p className="text-sm text-foreground-muted">No data to display</p>
    </div>
  );
}

// ─── ChartContainer ───────────────────────────────────────────────────────────

interface ChartContainerProps {
  config?: VisualizationConfig;
  option?: any;
  title?: string;
  description?: string;
  height?: number | string;
  loading?: boolean;
  empty?: boolean;
  className?: string;
}

export function ChartContainer({
  config,
  option,
  title,
  description,
  height = 320,
  loading = false,
  empty = false,
  className,
}: ChartContainerProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface p-4 md:p-5',
        className
      )}
    >
      {/* Header */}
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          )}
          {description && (
            <p className="mt-0.5 text-xs text-foreground-muted">{description}</p>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <ChartSkeleton height={height} />
      ) : empty || (!config && !option) ? (
        <ChartEmpty />
      ) : (
        <ChartRenderer config={config} option={option} height={height} />
      )}
    </div>
  );
}

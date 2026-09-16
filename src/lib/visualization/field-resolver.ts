/**
 * Field Resolution & Security Boundary — Phase 2D
 *
 * Locates and validates exact column references against canonical dataset tables.
 * Never silently substitutes fields or executes arbitrary expressions.
 */

import type { VizPilotTable, VizPilotColumn } from '@/src/types/dataset';
import { VisualizationError } from './errors';

export interface ResolvedField {
  column: VizPilotColumn;
  index: number;
}

export class FieldResolver {
  private readonly table: VizPilotTable;
  private readonly columnMap: Map<string, { column: VizPilotColumn; index: number }>;

  constructor(table: VizPilotTable) {
    this.table = table;
    this.columnMap = new Map();

    for (let i = 0; i < table.columns.length; i++) {
      const col = table.columns[i];
      // Index by lower-cased name and raw name
      this.columnMap.set(col.name.toLowerCase().trim(), { column: col, index: i });
      this.columnMap.set(col.id.toLowerCase().trim(), { column: col, index: i });
    }
  }

  /**
   * Resolves a field name or ID to a canonical column.
   * Throws VISUALIZATION_FIELD_NOT_FOUND if field is missing.
   */
  resolveRequired(fieldName: string, roleDescription: string = 'Field'): ResolvedField {
    const key = fieldName.toLowerCase().trim();
    const match = this.columnMap.get(key);

    if (!match) {
      throw new VisualizationError(
        'VISUALIZATION_FIELD_NOT_FOUND',
        `${roleDescription} "${fieldName}" does not exist in table "${this.table.name}".`,
        400,
        { fieldName, table: this.table.name, availableColumns: this.table.columns.map((c) => c.name) }
      );
    }

    return match;
  }

  /**
   * Resolves an optional field name or ID. Returns undefined if not specified or not found.
   */
  resolveOptional(fieldName?: string): ResolvedField | undefined {
    if (!fieldName) return undefined;
    const key = fieldName.toLowerCase().trim();
    return this.columnMap.get(key);
  }

  /**
   * Resolves an array of measure fields (e.g. y-axis metrics).
   */
  resolveMeasures(fields?: string[]): ResolvedField[] {
    if (!fields || fields.length === 0) return [];
    return fields.map((f) => this.resolveRequired(f, 'Measure field'));
  }
}

/**
 * VizPilot Deterministic Data Profiling Engine — Phase 2B
 *
 * Public Entry Point
 */

import type { VizPilotDataset } from '@/src/types/dataset';
import type { VizPilotDataProfile } from '@/src/types/profiling';
import { profileDatasetCore, PROFILER_VERSION } from './profiler';

export * from './profiler';
export * from './column-profiler';
export * from './statistics';
export * from './categorical';
export * from './temporal';
export * from './quality';
export * from './semantic-role';
export * from './relationships';
export * from './sampling';
export * from './utils';

/**
 * Deterministically profiles a VizPilotDataset into a complete VizPilotDataProfile.
 * Zero external calls. Zero LLM calls. Fully reproducible.
 *
 * @param dataset — Canonical VizPilotDataset produced by the ingestion pipeline
 * @returns VizPilotDataProfile
 */
export function profileDataset(dataset: VizPilotDataset): VizPilotDataProfile {
  return profileDatasetCore(dataset);
}

export { PROFILER_VERSION };

/**
 * Client Volatile In-Memory Store — Phase 2E
 *
 * Provides a volatile RAM-only store for datasets and profiles during active
 * client-side SPA navigation. Never writes to sessionStorage, localStorage,
 * or browser disk in Zero-Trace mode.
 *
 * Automatically cleared when tab closes, page refreshes, or workflow resets.
 */

import type { VizPilotDataset } from '@/src/types/dataset';
import type { VizPilotDataProfile } from '@/src/types/profiling';

class ClientMemoryStore {
  private activeDataset: VizPilotDataset | null = null;
  private datasetsById = new Map<string, VizPilotDataset>();
  private activeProfile: VizPilotDataProfile | null = null;
  private profilesById = new Map<string, VizPilotDataProfile>();

  public setDataset(dataset: VizPilotDataset): void {
    this.activeDataset = dataset;
    if (dataset.id) {
      this.datasetsById.set(dataset.id, dataset);
    }
  }

  public getDataset(id?: string | null): VizPilotDataset | null {
    if (id && this.datasetsById.has(id)) {
      return this.datasetsById.get(id) || null;
    }
    return this.activeDataset;
  }

  public setProfile(profile: VizPilotDataProfile): void {
    this.activeProfile = profile;
    if (profile.datasetId) {
      this.profilesById.set(profile.datasetId, profile);
    }
  }

  public getProfile(datasetId?: string | null): VizPilotDataProfile | null {
    if (datasetId && this.profilesById.has(datasetId)) {
      return this.profilesById.get(datasetId) || null;
    }
    return this.activeProfile;
  }

  public clear(): void {
    this.activeDataset = null;
    this.datasetsById.clear();
    this.activeProfile = null;
    this.profilesById.clear();
  }
}

// Singleton in browser runtime
export const clientMemoryStore = new ClientMemoryStore();

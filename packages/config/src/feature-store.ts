import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { FeatureId } from './features.js';

const STORE_PATH = path.join(os.homedir(), '.reactpilot', 'features.json');

export interface FeatureStore {
  selectedFeatures: FeatureId[];
  configuredAt: string;   // ISO timestamp of last configuration
  version: string;        // ReactPilot version at time of config
}

export function readFeatureStore(): FeatureStore | null {
  if (!fs.existsSync(STORE_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8')) as FeatureStore;
  } catch {
    return null;
  }
}

export function writeFeatureStore(store: FeatureStore): void {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

export function isFeatureEnabled(featureId: FeatureId): boolean {
  const store = readFeatureStore();
  if (!store) return true; // unconfigured = all features active (backward compat)
  return store.selectedFeatures.includes(featureId);
}

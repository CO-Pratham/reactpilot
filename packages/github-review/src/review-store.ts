import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { ReviewResult } from './types.js';

const HISTORY_DIR = path.join(os.homedir(), '.reactpilot', 'history');
const LATEST_REVIEW_FILE = path.join(HISTORY_DIR, 'latest-review.json');

export type RunType = 'review' | 'graph' | 'migrate' | 'plugins' | 'ask' | 'analyze';

export interface StoredReview extends ReviewResult {
  id: string;
  projectPath: string;
  skippedFileCount?: number;
  source: 'local' | 'github-action';
  type?: 'review';
}

export interface DashboardRun {
  id: string;
  type: RunType;
  title: string;
  timestamp: string;
  projectPath: string;
  score?: number;
  issueCount?: number;
  summary: Record<string, unknown>;
}

export function saveReviewResult(
  result: ReviewResult,
  meta: {
    projectPath: string;
    skippedFileCount?: number;
    source: 'local' | 'github-action';
  }
): StoredReview {
  fs.mkdirSync(HISTORY_DIR, { recursive: true });

  const id = `review-${Date.now()}`;
  const stored: StoredReview = {
    ...result,
    id,
    type: 'review',
    projectPath: meta.projectPath,
    skippedFileCount: meta.skippedFileCount,
    source: meta.source,
  };

  fs.writeFileSync(path.join(HISTORY_DIR, `report-${id}.json`), JSON.stringify(stored, null, 2), 'utf-8');
  fs.writeFileSync(LATEST_REVIEW_FILE, JSON.stringify(stored, null, 2), 'utf-8');

  saveRun({
    type: 'review',
    title: 'Code Review',
    projectPath: meta.projectPath,
    score: result.totalScore,
    issueCount: result.issues.length,
    summary: {
      filesReviewed: result.filesReviewed.length,
      hasBreakingChanges: result.hasBreakingChanges,
      estimatedFixMinutes: result.estimatedFixMinutes,
      skippedFileCount: meta.skippedFileCount ?? 0,
      source: meta.source,
    },
  });

  return stored;
}

export function getLatestReview(): StoredReview | null {
  if (fs.existsSync(LATEST_REVIEW_FILE)) {
    try {
      const raw = JSON.parse(fs.readFileSync(LATEST_REVIEW_FILE, 'utf-8')) as StoredReview;
      if (raw.totalScore !== undefined) return raw;
    } catch {
      // fall through to report scan
    }
  }

  if (!fs.existsSync(HISTORY_DIR)) return null;

  const reports = fs
    .readdirSync(HISTORY_DIR)
    .filter((file) => file.startsWith('report-review-') && file.endsWith('.json'))
    .sort()
    .reverse();

  for (const file of reports) {
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(HISTORY_DIR, file), 'utf-8')) as StoredReview;
      if (raw.totalScore !== undefined) {
        fs.writeFileSync(LATEST_REVIEW_FILE, JSON.stringify(raw, null, 2), 'utf-8');
        return raw;
      }
    } catch {
      // try next report
    }
  }

  const legacy = fs
    .readdirSync(HISTORY_DIR)
    .filter((file) => file.startsWith('review-') && file.endsWith('.json') && !file.startsWith('review-store'))
    .sort()
    .reverse();

  for (const file of legacy) {
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(HISTORY_DIR, file), 'utf-8')) as StoredReview;
      if (raw.totalScore !== undefined) return raw;
    } catch {
      // try next
    }
  }

  return null;
}

export function saveRun(
  run: Omit<DashboardRun, 'id' | 'timestamp'> & { timestamp?: string }
): DashboardRun {
  fs.mkdirSync(HISTORY_DIR, { recursive: true });

  const record: DashboardRun = {
    ...run,
    id: `run-${run.type}-${Date.now()}`,
    timestamp: run.timestamp ?? new Date().toISOString(),
  };

  fs.writeFileSync(path.join(HISTORY_DIR, `${record.id}.json`), JSON.stringify(record, null, 2), 'utf-8');
  fs.writeFileSync(path.join(HISTORY_DIR, `latest-run-${run.type}.json`), JSON.stringify(record, null, 2), 'utf-8');

  return record;
}

export function getLatestRun(type: RunType): DashboardRun | null {
  const candidates = [
    path.join(HISTORY_DIR, `latest-run-${type}.json`),
    path.join(HISTORY_DIR, `latest-${type}.json`),
  ];

  for (const latestPath of candidates) {
    if (!fs.existsSync(latestPath)) continue;
    try {
      const raw = JSON.parse(fs.readFileSync(latestPath, 'utf-8')) as Record<string, unknown>;
      if (raw.totalScore !== undefined) continue;
      return raw as unknown as DashboardRun;
    } catch {
      // try next candidate
    }
  }

  return null;
}

export function listRuns(limit = 50): DashboardRun[] {
  if (!fs.existsSync(HISTORY_DIR)) return [];

  const runs: DashboardRun[] = [];

  for (const file of fs.readdirSync(HISTORY_DIR)) {
    if (!file.endsWith('.json') || file.startsWith('latest-')) continue;
    if (file.startsWith('report-')) continue;

    try {
      const raw = JSON.parse(fs.readFileSync(path.join(HISTORY_DIR, file), 'utf-8')) as Record<string, unknown>;
      if (raw.totalScore !== undefined && raw.categories) continue;
      if (!raw.type || typeof raw.type !== 'string') continue;

      runs.push({
        id: String(raw.id ?? file.replace('.json', '')),
        type: raw.type as RunType,
        title: String(raw.title ?? raw.type),
        timestamp: String(raw.timestamp ?? raw.reviewedAt ?? ''),
        projectPath: String(raw.projectPath ?? ''),
        score: typeof raw.score === 'number' ? raw.score : undefined,
        issueCount: typeof raw.issueCount === 'number' ? raw.issueCount : undefined,
        summary: (raw.summary as Record<string, unknown>) ?? {},
      });
    } catch {
      // skip invalid files
    }
  }

  return runs
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit);
}

export function getReviewById(id: string): StoredReview | null {
  const candidates = [
    path.join(HISTORY_DIR, `report-${id}.json`),
    path.join(HISTORY_DIR, `${id}.json`),
  ];

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    try {
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as StoredReview;
      if (raw.totalScore !== undefined) return raw;
    } catch {
      // try next
    }
  }

  return null;
}

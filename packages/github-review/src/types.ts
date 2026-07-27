// ─── Review Categories ────────────────────────────────────────────────────────

export type ReviewCategoryId =
  | 'performance'
  | 'accessibility'
  | 'security'
  | 'maintainability'
  | 'architecture'
  | 'bundle';

export type ReviewSeverity = 'critical' | 'error' | 'warning' | 'info';

export interface ReviewIssue {
  /** Category this issue belongs to */
  category: ReviewCategoryId;
  severity: ReviewSeverity;
  message: string;
  /** File path relative to repo root */
  file: string;
  line?: number;
  /** Suggested fix in human-readable form */
  suggestion?: string;
  /** Inline code snippet showing the problem */
  code?: string;
}

// ─── Diff Types ───────────────────────────────────────────────────────────────

export interface DiffHunk {
  header: string;
  startLine: number;
  lines: DiffLine[];
}

export interface DiffLine {
  type: 'added' | 'removed' | 'context';
  content: string;
  lineNumber: number;
}

export interface FileDiff {
  filename: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  patch?: string;
  hunks: DiffHunk[];
  addedLines: string[];
  removedLines: string[];
  /** Full file content (added files) or null for deleted */
  content?: string | null;
}

// ─── Review Result ────────────────────────────────────────────────────────────

export interface CategoryScore {
  id: ReviewCategoryId;
  label: string;
  score: number;      // 0-100
  weight: number;     // contribution to total score
  status: 'excellent' | 'good' | 'warning' | 'critical';
  issues: ReviewIssue[];
}

export interface ReviewResult {
  /** Overall weighted score 0-100 */
  totalScore: number;
  categories: CategoryScore[];
  issues: ReviewIssue[];
  /** Files included in the review */
  filesReviewed: string[];
  /** Whether any breaking changes were detected */
  hasBreakingChanges: boolean;
  /** Estimated time to fix all issues (minutes) */
  estimatedFixMinutes: number;
  /** Markdown report ready to post to GitHub */
  markdownReport: string;
  /** ISO timestamp */
  reviewedAt: string;
}

// ─── GitHub PR Context ────────────────────────────────────────────────────────

export interface PRContext {
  owner: string;
  repo: string;
  pullNumber: number;
  headSha: string;
  baseSha: string;
  title: string;
  body?: string;
}

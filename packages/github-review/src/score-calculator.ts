import type { CategoryScore, ReviewIssue, ReviewCategoryId } from './types.js';

const CATEGORY_WEIGHTS: Record<ReviewCategoryId, number> = {
  performance:     25,
  accessibility:   20,
  security:        25,
  maintainability: 15,
  architecture:    10,
  bundle:           5,
};

const CATEGORY_LABELS: Record<ReviewCategoryId, string> = {
  performance:     'Performance',
  accessibility:   'Accessibility',
  security:        'Security',
  maintainability: 'Maintainability',
  architecture:    'Architecture',
  bundle:          'Bundle Impact',
};

const ISSUE_DEDUCTIONS: Record<ReviewIssue['severity'], number> = {
  critical: 20,
  error:    10,
  warning:   5,
  info:      1,
};

/** Estimated fix times per severity (minutes) */
const FIX_MINUTES: Record<ReviewIssue['severity'], number> = {
  critical: 30,
  error:    10,
  warning:   5,
  info:      1,
};

/**
 * Calculate per-category scores and the final weighted total.
 */
export function calculateScores(
  issuesByCategory: Record<ReviewCategoryId, ReviewIssue[]>
): CategoryScore[] {
  const categories: CategoryScore[] = [];

  for (const [id, issues] of Object.entries(issuesByCategory) as [ReviewCategoryId, ReviewIssue[]][]) {
    const deduction = issues.reduce((sum, i) => sum + ISSUE_DEDUCTIONS[i.severity], 0);
    const score = Math.max(0, Math.min(100, 100 - deduction));

    categories.push({
      id,
      label: CATEGORY_LABELS[id],
      score,
      weight: CATEGORY_WEIGHTS[id],
      status: scoreToStatus(score),
      issues,
    });
  }

  return categories;
}

/**
 * Calculate the final weighted score from category scores.
 */
export function calculateTotalScore(categories: CategoryScore[]): number {
  const totalWeight = categories.reduce((sum, c) => sum + c.weight, 0);
  const weightedSum = categories.reduce((sum, c) => sum + c.score * c.weight, 0);
  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 100;
}

/**
 * Estimate total fix time from all issues.
 */
export function estimateFixTime(issues: ReviewIssue[]): number {
  return issues.reduce((sum, i) => sum + FIX_MINUTES[i.severity], 0);
}

function scoreToStatus(score: number): CategoryScore['status'] {
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'warning';
  return 'critical';
}

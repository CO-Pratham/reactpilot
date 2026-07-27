import type { FileDiff, ReviewResult, ReviewCategoryId, ReviewIssue } from './types.js';
import { reviewPerformance } from './reviewers/performance.js';
import { reviewAccessibility } from './reviewers/accessibility.js';
import { reviewSecurity } from './reviewers/security.js';
import { reviewMaintainability } from './reviewers/maintainability.js';
import { reviewArchitecture } from './reviewers/architecture.js';
import { reviewBundle } from './reviewers/bundle.js';
import { calculateScores, calculateTotalScore, estimateFixTime } from './score-calculator.js';
import { generateMarkdownReport } from './report-generator.js';

/**
 * Run all reviewers on the given file diffs and produce a ReviewResult.
 */
export async function runFullReview(
  files: FileDiff[],
  projectRoot: string
): Promise<ReviewResult> {
  // Run all reviewers (performance is async, rest are sync)
  const [performanceIssues, accessibilityIssues, securityIssues, maintainabilityIssues, architectureIssues, bundleIssues] =
    await Promise.all([
      reviewPerformance(files, projectRoot),
      Promise.resolve(reviewAccessibility(files)),
      Promise.resolve(reviewSecurity(files)),
      Promise.resolve(reviewMaintainability(files)),
      Promise.resolve(reviewArchitecture(files)),
      Promise.resolve(reviewBundle(files)),
    ]);

  const issuesByCategory: Record<ReviewCategoryId, ReviewIssue[]> = {
    performance:     performanceIssues,
    accessibility:   accessibilityIssues,
    security:        securityIssues,
    maintainability: maintainabilityIssues,
    architecture:    architectureIssues,
    bundle:          bundleIssues,
  };

  const allIssues = Object.values(issuesByCategory).flat();
  const categories = calculateScores(issuesByCategory);
  const totalScore = calculateTotalScore(categories);
  const estimatedFixMinutes = estimateFixTime(allIssues);

  const hasBreakingChanges = allIssues.some(
    (i) => i.severity === 'critical' || (i.category === 'architecture' && i.severity === 'error')
  );

  const filesReviewed = [...new Set(files.map((f) => f.filename))];

  const result: ReviewResult = {
    totalScore,
    categories,
    issues: allIssues,
    filesReviewed,
    hasBreakingChanges,
    estimatedFixMinutes,
    markdownReport: '',
    reviewedAt: new Date().toISOString(),
  };

  result.markdownReport = generateMarkdownReport(result);

  return result;
}

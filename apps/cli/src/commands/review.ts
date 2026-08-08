import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { runFullReview, createGitHubClient, getPRContext, postReviewComment, saveReviewResult } from '@reactpilot/github-review';
import { loadConfig, isFeatureEnabled } from '@reactpilot/config';
import { withSpinner, printSection, printSuccess, printWarning, printInfo, colors } from '@reactpilot/utils/ui';

const REVIEW_EXCLUDE_PATTERNS = [
  /(^|\/)node_modules\//,
  /(^|\/)dist\//,
  /(^|\/)dist$/,
  /(^|\/)\.next\//,
  /(^|\/)\.turbo\//,
  /(^|\/)coverage\//,
  /package-lock\.json$/,
];

function isReviewablePath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  return !REVIEW_EXCLUDE_PATTERNS.some((pattern) => pattern.test(normalized));
}

function runGit(cwd: string, args: string[]): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function collectLocalDiff(cwd: string): { diff: string; skippedCount: number } {
  try {
    runGit(cwd, ['rev-parse', '--is-inside-work-tree']);
  } catch {
    throw new Error('NOT_A_GIT_REPO');
  }

  let changedFiles: string[];
  try {
    changedFiles = runGit(cwd, ['diff', '--name-only', 'HEAD'])
      .split('\n')
      .map((file) => file.trim())
      .filter(Boolean);
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error.code === 'ENOBUFS') throw new Error('DIFF_TOO_LARGE');
    throw err;
  }

  const reviewableFiles = changedFiles.filter(isReviewablePath);
  const skippedCount = changedFiles.length - reviewableFiles.length;

  if (reviewableFiles.length === 0) {
    return { diff: '', skippedCount };
  }

  try {
    const diff = runGit(cwd, ['diff', 'HEAD', '--', ...reviewableFiles]);
    return { diff, skippedCount };
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error.code === 'ENOBUFS') throw new Error('DIFF_TOO_LARGE');
    throw err;
  }
}

interface ReviewOptions {
  githubAction?: boolean;
  output?: string;
  token?: string;
}

/**
 * CLI command runner for `reactpilot review [target]`
 */
export async function runReview(targetDir: string, options: ReviewOptions): Promise<void> {
  if (!isFeatureEnabled('github-review')) {
    console.error(colors.error('The "github-review" feature is not enabled.\nRun: reactpilot features -> select "GitHub / PR Review" to enable it.'));
    process.exit(1);
  }

  printSection('ReactPilot Code Review');

  const cwd = path.resolve(targetDir);
  const { config } = await loadConfig(cwd);

  const token = options.token ?? config.review.githubToken ?? process.env.GITHUB_TOKEN;

  if (options.githubAction) {
    if (!token) {
      console.error(colors.error('Error: GITHUB_TOKEN is required when running in GitHub Actions.'));
      process.exit(1);
    }

    const prContext = getPRContext();
    if (!prContext.pullNumber) {
      console.error(colors.error('Error: Not running in a pull request context (missing pull request info).'));
      process.exit(1);
    }

    const octokit = createGitHubClient(token);

    const result = await withSpinner(
      `Fetching PR diff and running review for PR #${prContext.pullNumber}...`,
      async () => {
        // Dynamic fetch of PR diff using octokit
        const { data } = await octokit.rest.pulls.get({
          owner: prContext.owner,
          repo: prContext.repo,
          pull_number: prContext.pullNumber,
          mediaType: { format: 'diff' },
        });

        const { parseDiff } = await import('@reactpilot/github-review');
        const diffFiles = parseDiff(data as unknown as string);
        return runFullReview(diffFiles, cwd);
      },
      'Review complete'
    );

    await withSpinner(
      'Posting review comment to GitHub...',
      () => postReviewComment(octokit, prContext, result.markdownReport),
      'Comment posted successfully'
    );

    console.log(`\nPR Review Score: ${colors.scoreColor(result.totalScore)(result.totalScore + '/100')}`);
    if (result.hasBreakingChanges) {
      printWarning('Breaking changes or critical issues detected.');
    }

    saveReviewResult(result, {
      projectPath: cwd,
      source: 'github-action',
    });

    // Fail check if score is below configured threshold
    const threshold = config.review.failOnScore;
    if (threshold !== undefined && result.totalScore < threshold) {
      console.error(colors.error(`PR score (${result.totalScore}) is below threshold (${threshold}). Failing check.`));
      process.exit(1);
    }

    return;
  }

  // Local mode (git diff, excluding build artifacts)
  let rawDiff = '';
  let skippedCount = 0;
  try {
    const result = collectLocalDiff(cwd);
    rawDiff = result.diff;
    skippedCount = result.skippedCount;
  } catch (err) {
    if (err instanceof Error && err.message === 'NOT_A_GIT_REPO') {
      console.error(colors.error('Failed to run git diff. Make sure you are inside a git repository.'));
      process.exit(1);
    }
    if (err instanceof Error && err.message === 'DIFF_TOO_LARGE') {
      console.error(
        colors.error(
          'Git diff is too large to process. Commit or stash build artifacts (dist/, .next/) and try again.'
        )
      );
      process.exit(1);
    }
    console.error(colors.error(`Failed to run git diff: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }

  if (skippedCount > 0) {
    printInfo(`Skipped ${skippedCount} build/cache file(s) (dist, node_modules, .next, etc.).`);
  }

  if (!rawDiff.trim()) {
    printSuccess('No reviewable source changes detected. Nothing to review.');
    return;
  }

  const { parseDiff } = await import('@reactpilot/github-review');
  const diffFiles = parseDiff(rawDiff);

  const result = await withSpinner(
    `Analyzing local changes (${diffFiles.length} files)...`,
    () => runFullReview(diffFiles, cwd),
    'Analysis complete'
  );

  console.log('\n' + result.markdownReport);

  saveReviewResult(result, {
    projectPath: cwd,
    skippedFileCount: skippedCount,
    source: 'local',
  });
  printInfo('Review saved. Refresh the Developer Center dashboard to see the visual report.');

  if (options.output) {
    const outPath = path.resolve(options.output);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, result.markdownReport, 'utf-8');
    printSuccess(`Report written to ${outPath}`);
  }
}

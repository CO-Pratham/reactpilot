import { Octokit } from '@octokit/rest';
import type { PRContext, FileDiff } from './types.js';
import { parseDiff } from './diff-parser.js';

/**
 * Create an authenticated Octokit instance from the environment or explicit token.
 */
export function createGitHubClient(token?: string): Octokit {
  const t = token ?? process.env.GITHUB_TOKEN;
  if (!t) {
    throw new Error(
      'GitHub token is required. Set GITHUB_TOKEN environment variable or pass --token.\n' +
      'Docs: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token'
    );
  }
  return new Octokit({ auth: t });
}

/**
 * Extract PR context from environment variables (GitHub Actions) or arguments.
 */
export function getPRContext(
  owner?: string,
  repo?: string,
  pullNumber?: number
): PRContext {
  // GitHub Actions auto-injects these
  const ref = process.env.GITHUB_REF ?? '';
  const prMatch = ref.match(/refs\/pull\/(\d+)\/merge/);
  const envPR = prMatch ? parseInt(prMatch[1], 10) : undefined;

  const [envOwner, envRepo] = (process.env.GITHUB_REPOSITORY ?? '/').split('/');

  return {
    owner: owner ?? envOwner ?? '',
    repo: repo ?? envRepo ?? '',
    pullNumber: pullNumber ?? envPR ?? 0,
    headSha: process.env.GITHUB_SHA ?? '',
    baseSha: '',
    title: '',
  };
}

/**
 * Fetch the diff for a pull request as structured FileDiff objects.
 */
export async function fetchPRDiff(
  octokit: Octokit,
  ctx: PRContext
): Promise<FileDiff[]> {
  const { data } = await octokit.rest.pulls.get({
    owner: ctx.owner,
    repo: ctx.repo,
    pull_number: ctx.pullNumber,
    mediaType: { format: 'diff' },
  });

  // The diff is returned as raw text when mediaType.format = 'diff'
  return parseDiff(data as unknown as string);
}

/**
 * Post a comment to a PR, or update the existing ReactPilot comment.
 */
export async function postReviewComment(
  octokit: Octokit,
  ctx: PRContext,
  body: string
): Promise<void> {
  const MARKER = '<!-- reactpilot-review -->';

  // Look for existing comment to update
  const { data: comments } = await octokit.rest.issues.listComments({
    owner: ctx.owner,
    repo: ctx.repo,
    issue_number: ctx.pullNumber,
    per_page: 100,
  });

  const existing = comments.find((c) => c.body?.includes(MARKER));

  const MAX_LEN = 65000;
  let fullBody = `${MARKER}\n${body}`;

  if (fullBody.length > MAX_LEN) {
    fullBody =
      fullBody.slice(0, MAX_LEN - 150) +
      '\n\n---\n> ⚠ **Note:** *This report was truncated because it exceeded GitHub\'s 65,000 character comment limit. Run `reactpilot review` locally to see full details.*';
  }

  if (existing) {
    await octokit.rest.issues.updateComment({
      owner: ctx.owner,
      repo: ctx.repo,
      comment_id: existing.id,
      body: fullBody,
    });
  } else {
    await octokit.rest.issues.createComment({
      owner: ctx.owner,
      repo: ctx.repo,
      issue_number: ctx.pullNumber,
      body: fullBody,
    });
  }
}

/**
 * Save overall review score as a PR check status.
 */
export async function setCommitStatus(
  octokit: Octokit,
  ctx: PRContext,
  score: number
): Promise<void> {
  if (!ctx.headSha) return;

  const state = score >= 70 ? 'success' : score >= 50 ? 'failure' : 'failure';

  await octokit.rest.repos.createCommitStatus({
    owner: ctx.owner,
    repo: ctx.repo,
    sha: ctx.headSha,
    state,
    description: `ReactPilot Score: ${score}/100`,
    context: 'ReactPilot Review',
    target_url: 'https://github.com/CO-Pratham/reactpilot',
  });
}

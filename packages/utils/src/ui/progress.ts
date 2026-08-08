import ora from 'ora';
import type { Ora } from 'ora';
import { colors } from './colors.js';

type OraFactory = (...args: Parameters<typeof ora>) => Ora;

function getOra(): OraFactory {
  const candidate = (ora as unknown as { default?: typeof ora }).default ?? ora;
  if (typeof candidate !== 'function') throw new Error('Unable to load ora spinner.');
  return candidate as OraFactory;
}

/**
 * Start a spinner with a consistent ReactPilot theme.
 * Returns the spinner instance for chaining (.succeed / .fail / .warn).
 */
export function startSpinner(text: string): Ora {
  return getOra()({
    text,
    color: 'cyan',
    spinner: 'dots',
  }).start();
}

/**
 * Run an async task with an automatic spinner.
 * Succeeds or fails the spinner based on the promise outcome.
 */
export async function withSpinner<T>(
  text: string,
  task: () => Promise<T>,
  successText?: string
): Promise<T> {
  const spinner = startSpinner(text);
  try {
    const result = await task();
    spinner.succeed(colors.success(successText ?? text));
    return result;
  } catch (err) {
    spinner.fail(colors.error(err instanceof Error ? err.message : String(err)));
    throw err;
  }
}

/**
 * Show a step header in a multi-step CLI flow.
 * e.g.  [1/5] Building graph...
 */
export function stepHeader(step: number, total: number, label: string): void {
  console.log(
    colors.accent(`[${step}/${total}]`) + ' ' + colors.bold(label)
  );
}

/** Print a success banner */
export function printSuccess(msg: string): void {
  console.log(colors.success(`✔ ${msg}`));
}

/** Print a warning banner */
export function printWarning(msg: string): void {
  console.warn(colors.warning(`⚠ ${msg}`));
}

/** Print an info line */
export function printInfo(msg: string): void {
  console.log(colors.info(`ℹ ${msg}`));
}

/** Print a section header */
export function printSection(title: string): void {
  const line = '─'.repeat(Math.max(0, 50 - title.length - 3));
  console.log('\n' + colors.accent(`── ${title} ${line}`));
}

/** Print a stylized callout box in terminal */
export function printBoxCallout(title: string, lines: string[]): void {
  const cleanTitle = title.replace(/\u001b\[\d+m/g, '');
  const maxLen = Math.max(cleanTitle.length, ...lines.map((l) => l.replace(/\u001b\[\d+m/g, '').length));
  const width = Math.max(72, maxLen + 6);

  const top = '┌' + '─'.repeat(width - 2) + '┐';
  const mid = '├' + '─'.repeat(width - 2) + '┤';
  const bot = '└' + '─'.repeat(width - 2) + '┘';

  console.log('\n' + colors.accent(top));
  console.log(colors.accent('│  ') + colors.bold(title).padEnd(width - 3 + (title.length - cleanTitle.length)) + colors.accent('│'));
  console.log(colors.accent(mid));
  for (const line of lines) {
    const cleanLine = line.replace(/\u001b\[\d+m/g, '');
    const padding = width - 4 - cleanLine.length;
    console.log(colors.accent('│  ') + line + ' '.repeat(Math.max(0, padding)) + colors.accent('│'));
  }
  console.log(colors.accent(bot) + '\n');
}


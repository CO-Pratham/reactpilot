import { colors } from './colors.js';

/** A single table row — values can be pre-colored strings */
export type TableRow = (string | number)[];

export interface TableOptions {
  head: string[];
  /** Column alignment per-index. Default: 'left' */
  align?: Array<'left' | 'right' | 'center'>;
  /** Max width for each column (chars). 0 = no limit */
  maxWidth?: number[];
}

/**
 * Render a plain-text table without native addons.
 * Returns a formatted string ready to print.
 */
export function renderTable(rows: TableRow[], opts: TableOptions): string {
  const { head, align = [], maxWidth = [] } = opts;

  // Compute column widths
  const colCount = head.length;
  const colWidths: number[] = Array.from({ length: colCount }, (_, i) => {
    const headerLen = stripAnsi(head[i]).length;
    const maxDataLen = rows.reduce((m, row) => {
      const cell = String(row[i] ?? '');
      return Math.max(m, stripAnsi(cell).length);
    }, 0);
    const limit = maxWidth[i] ?? 0;
    const natural = Math.max(headerLen, maxDataLen);
    return limit > 0 ? Math.min(natural, limit) : natural;
  });

  const separator = colWidths.map((w) => '─'.repeat(w + 2)).join('┼');
  const top = colWidths.map((w) => '─'.repeat(w + 2)).join('┬');
  const bottom = colWidths.map((w) => '─'.repeat(w + 2)).join('┴');

  const pad = (s: string, width: number, a: 'left' | 'right' | 'center' = 'left'): string => {
    const raw = stripAnsi(s);
    const ansiExtra = s.length - raw.length;
    const total = width + ansiExtra;
    if (a === 'right') return s.padStart(total);
    if (a === 'center') {
      const half = Math.floor((width - raw.length) / 2);
      return ' '.repeat(Math.max(0, half)) + s + ' '.repeat(Math.max(0, width - raw.length - half));
    }
    return s.padEnd(total);
  };

  const renderRow = (cells: (string | number)[], isHead = false): string => {
    const formatted = cells.map((c, i) => {
      const s = isHead ? colors.bold(String(c)) : String(c);
      return ' ' + pad(s, colWidths[i], align[i]) + ' ';
    });
    return '│' + formatted.join('│') + '│';
  };

  const lines: string[] = [];
  lines.push('┌' + top + '┐');
  lines.push(renderRow(head, true));
  lines.push('├' + separator + '┤');
  rows.forEach((row) => lines.push(renderRow(row)));
  lines.push('└' + bottom + '┘');

  return lines.join('\n');
}

/** Strip ANSI escape codes for length measurement */
function stripAnsi(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1B\[[0-9;]*m/g, '');
}

/** Print a table to stdout */
export function printTable(rows: TableRow[], opts: TableOptions): void {
  console.log(renderTable(rows, opts));
}

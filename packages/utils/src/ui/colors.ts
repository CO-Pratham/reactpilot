import chalk, { Chalk } from 'chalk';

/**
 * Consistent chalk theme tokens used across all CLI output.
 * Import from this module instead of using chalk directly.
 */
export const colors = {
  // Semantic
  success: chalk.hex('#4ADE80'),    // green-400
  error: chalk.hex('#F87171'),      // red-400
  warning: chalk.hex('#FBBF24'),    // amber-400
  info: chalk.hex('#60A5FA'),       // blue-400
  muted: chalk.hex('#9CA3AF'),      // gray-400
  accent: chalk.hex('#A78BFA'),     // violet-400

  // UI
  bold: chalk.bold,
  dim: chalk.dim,
  italic: chalk.italic,
  underline: chalk.underline,
  cyan: chalk.cyan,
  white: chalk.white,

  // Score colors
  scoreExcellent: chalk.hex('#4ADE80'),  // ≥ 90
  scoreGood: chalk.hex('#86EFAC'),       // ≥ 75
  scoreWarn: chalk.hex('#FBBF24'),       // ≥ 50
  scorePoor: chalk.hex('#F87171'),       // < 50

  scoreColor(n: number): any {
    if (n >= 90) return colors.scoreExcellent;
    if (n >= 75) return colors.scoreGood;
    if (n >= 50) return colors.scoreWarn;
    return colors.scorePoor;
  },

  severityColor(s: 'error' | 'warning' | 'info'): any {
    return s === 'error' ? colors.error : s === 'warning' ? colors.warning : colors.info;
  },
} as const;


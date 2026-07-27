// UI helpers for @reactpilot/utils
// Import via: import { ... } from '@reactpilot/utils/ui'

export { colors } from './colors.js';
export { formatError, printError, wrapError, ErrorCodes } from './errors.js';
export type { StructuredError } from './errors.js';
export { renderTable, printTable } from './table.js';
export type { TableRow, TableOptions } from './table.js';
export {
  startSpinner,
  withSpinner,
  stepHeader,
  printSuccess,
  printWarning,
  printInfo,
  printSection,
} from './progress.js';
export { confirm, select, multiSelect, input } from './prompt.js';
export type {
  ConfirmOptions,
  SelectOptions,
  MultiSelectOptions,
  InputOptions,
} from './prompt.js';

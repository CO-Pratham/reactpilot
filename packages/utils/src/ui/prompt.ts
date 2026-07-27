/**
 * Lightweight prompt helpers built on enquirer.
 * All functions are async and resolve to typed values.
 */

export interface ConfirmOptions {
  message: string;
  initial?: boolean;
}

export interface SelectOptions<T extends string = string> {
  message: string;
  choices: { name: T; message: string; hint?: string }[];
  initial?: number;
}

export interface MultiSelectOptions<T extends string = string> {
  message: string;
  choices: { name: T; message: string }[];
  initial?: T[];
}

export interface InputOptions {
  message: string;
  initial?: string;
  validate?: (value: string) => boolean | string;
}

async function getEnquirer() {
  const mod: any = await import('enquirer');
  return mod.default ?? mod;
}

/** Ask a yes/no question */
export async function confirm(opts: ConfirmOptions): Promise<boolean> {
  const enquirer = await getEnquirer();
  const Confirm = enquirer.Confirm ?? enquirer.default?.Confirm;
  if (!Confirm) throw new Error('enquirer Confirm not available');
  const prompt = new Confirm({ name: 'value', ...opts });
  return prompt.run();
}

/** Single-select from a list */
export async function select<T extends string>(
  opts: SelectOptions<T>
): Promise<T> {
  const enquirer = await getEnquirer();
  const Select = enquirer.Select ?? enquirer.default?.Select;
  if (!Select) throw new Error('enquirer Select not available');
  const prompt = new Select({ name: 'value', ...opts });
  return prompt.run();
}

/** Multi-select from a list */
export async function multiSelect<T extends string>(
  opts: MultiSelectOptions<T>
): Promise<T[]> {
  const enquirer = await getEnquirer();
  const MultiSelect = enquirer.MultiSelect ?? enquirer.default?.MultiSelect;
  if (!MultiSelect) throw new Error('enquirer MultiSelect not available');
  const prompt = new MultiSelect({ name: 'value', ...opts });
  return prompt.run();
}

/** Free-text input */
export async function input(opts: InputOptions): Promise<string> {
  const enquirer = await getEnquirer();
  const Input = enquirer.Input ?? enquirer.default?.Input;
  if (!Input) throw new Error('enquirer Input not available');
  const prompt = new Input({ name: 'value', ...opts });
  return prompt.run();
}

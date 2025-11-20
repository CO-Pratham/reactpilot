import { unusedImports } from './unusedImports';
import { heavyComponent } from './heavyComponent';
import { invalidHooks } from './invalidHooks';
import { inlineFunctions } from './inlineFunctions';
import { deepJSX } from './deepJSX';
import { unusedState } from './unusedState';
import { expensiveRender } from './expensiveRender';

export const rules = [
  unusedImports,
  heavyComponent,
  invalidHooks,
  inlineFunctions,
  deepJSX,
  unusedState,
  expensiveRender
];

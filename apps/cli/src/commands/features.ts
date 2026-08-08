import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { FEATURES, type FeatureId } from '@reactpilot/config';
import { readFeatureStore, writeFeatureStore } from '@reactpilot/config';
import { colors, printSection, printSuccess, printInfo, printWarning, printBoxCallout } from '@reactpilot/utils/ui';

const PLUGINS_DIR = path.join(os.homedir(), '.reactpilot', 'plugins');

export interface FeaturesOptions {
  reset?: boolean;
  all?: boolean;
  none?: boolean;
}

export async function runFeatures(options: FeaturesOptions = {}): Promise<void> {
  printSection('ReactPilot Feature Setup');

  // Non-interactive flags
  if (options.all) {
    const allIds = FEATURES.map((f) => f.id);
    writeFeatureStore({
      selectedFeatures: allIds,
      configuredAt: new Date().toISOString(),
      version: '0.2.6',
    });
    printSuccess(`All ${allIds.length} features enabled.`);
    return;
  }

  if (options.none) {
    const defaultIds = FEATURES.filter((f) => f.defaultEnabled).map((f) => f.id);
    writeFeatureStore({
      selectedFeatures: defaultIds,
      configuredAt: new Date().toISOString(),
      version: '0.2.6',
    });
    printSuccess(`Only default features enabled: ${defaultIds.join(', ')}`);
    return;
  }

  const existing = readFeatureStore();

  if (existing && !options.reset) {
    printStatusTable(existing.selectedFeatures);
    console.log(colors.muted('\nRun "reactpilot features --reset" to reconfigure.\n'));
    return;
  }

  // Load enquirer for interactive multi-select
  const enquirerModule: any = await import('enquirer');
  const MultiSelect = enquirerModule.MultiSelect ?? enquirerModule.default?.MultiSelect ?? enquirerModule.default;

  const hasExistingSelection = existing && existing.selectedFeatures.length > 0;

  const allFeaturesChoice = {
    name: 'all_features',
    message: `${colors.accent('🌟 ALL FEATURES').padEnd(33)} — Enable & install all ReactPilot features`,
    value: 'all_features',
    enabled: hasExistingSelection ? existing.selectedFeatures.length === FEATURES.length : true,
  };

  const prompt = new MultiSelect({
    name: 'features',
    message: 'Select the features you want to install (Space = toggle, Enter = confirm)',
    hint: '(use arrow keys + space to select)',
    choices: [
      allFeaturesChoice,
      ...FEATURES.map((f) => ({
        name: f.id,
        message: `${f.name.padEnd(24)} — ${f.description}${
          f.requiresApiKey ? colors.muted(' [needs API key]') : ''
        }`,
        value: f.id,
        enabled: hasExistingSelection
          ? existing.selectedFeatures.includes(f.id)
          : true, // Default ALL features to checked so hit Enter = install all
      })),
    ],
  });

  let selectedRaw: string[];
  try {
    selectedRaw = (await prompt.run()) as string[];
  } catch {
    printInfo('Feature setup cancelled. No changes made.');
    return;
  }

  // If ALL FEATURES is toggled on OR no items were selected, default to ALL features enabled
  let selected: FeatureId[];
  if (selectedRaw.length === 0 || selectedRaw.includes('all_features')) {
    selected = FEATURES.map((f) => f.id);
    if (selectedRaw.length === 0) {
      printInfo('No individual items toggled off — enabling all features by default.');
    }
  } else {
    selected = selectedRaw.filter((id) => id !== 'all_features') as FeatureId[];
  }

  // Determine what changed
  const previouslySelected = existing?.selectedFeatures ?? [];
  const toInstall = selected.filter((id) => !previouslySelected.includes(id));
  const toUninstall = previouslySelected.filter((id) => !selected.includes(id));

  // Install newly-selected feature deps
  if (toInstall.length > 0) {
    console.log(`\n${colors.accent('Installing')} dependencies for ${toInstall.length} feature(s)...`);
    for (const id of toInstall) {
      const feature = FEATURES.find((f) => f.id === id)!;
      if (feature.externalDeps.length > 0) {
        console.log(colors.muted(`  + ${feature.name}: ${feature.externalDeps.join(', ')}`));
        try {
          execFileSync('npm', ['install', '--prefix', PLUGINS_DIR, ...feature.externalDeps, '--save'], {
            stdio: 'inherit',
            shell: process.platform === 'win32',
          });
        } catch (err) {
          printWarning(`Failed to install dependencies for ${feature.name}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }
  }

  // Uninstall deselected feature deps (only if no other selected feature also needs them)
  if (toUninstall.length > 0) {
    console.log(`\n${colors.muted('Uninstalling')} dependencies for ${toUninstall.length} deselected feature(s)...`);
    for (const id of toUninstall) {
      const feature = FEATURES.find((f) => f.id === id)!;
      const stillNeeded = new Set(
        selected.flatMap((sid) => FEATURES.find((f) => f.id === sid)?.externalDeps ?? [])
      );
      const depsToRemove = feature.externalDeps.filter((dep) => !stillNeeded.has(dep));
      if (depsToRemove.length > 0) {
        console.log(colors.muted(`  - ${feature.name}: ${depsToRemove.join(', ')}`));
        try {
          execFileSync('npm', ['uninstall', '--prefix', PLUGINS_DIR, ...depsToRemove], {
            stdio: 'inherit',
            shell: process.platform === 'win32',
          });
        } catch (err) {
          printWarning(`Failed to remove dependencies for ${feature.name}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }
  }

  // Persist selection
  writeFeatureStore({
    selectedFeatures: selected,
    configuredAt: new Date().toISOString(),
    version: '2.0.0',
  });

  printSuccess(`\nFeature setup complete! ${selected.length} feature(s) active.`);
  console.log(colors.muted('Run "reactpilot features" anytime to reconfigure.'));

  // Show API key reminder if any selected feature needs one
  const needsKey = selected.some((id) => FEATURES.find((f) => f.id === id)?.requiresApiKey);
  if (needsKey) {
    console.log(`\n${colors.warning('⚠')} Some selected features require an API key.`);
    console.log(colors.accent('  Set REACTPILOT_API_KEY in your .env file or via dashboard settings.'));
  }

  printBoxCallout(
    '✨ REACTPILOT PRO WAITLIST (EARLY ACCESS)',
    [
      'Want zero-setup managed AI without managing OpenAI keys or local LLMs?',
      'Get automated GitHub PR reviews and team AI chat.',
      '',
      colors.bold('👉 Run: "reactpilot dashboard" → Click "Join Pro Waitlist"')
    ]
  );
}

function printStatusTable(activeIds: FeatureId[]): void {
  console.log(colors.muted('Current Feature Status:'));
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  FEATURES.forEach((f) => {
    const active = activeIds.includes(f.id);
    const symbol = active ? colors.success('✔') : colors.error('✗');
    const status = active ? colors.success('installed    ') : colors.muted('not installed');
    console.log(`║  ${symbol}  ${f.name.padEnd(24)} ${status} ║`);
  });
  console.log('╚══════════════════════════════════════════════════════════════════╝');
}

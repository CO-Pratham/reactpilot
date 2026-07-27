import type { RegisteredPlugin } from './types.js';

/**
 * Auto-generate markdown documentation for a plugin.
 * Output can be written to disk or printed to stdout.
 */
export function generatePluginDocs(plugin: RegisteredPlugin): string {
  const { manifest, rules, prompts, generators, reportSections, fixes } = plugin;

  const lines: string[] = [];

  lines.push(`# ${manifest.name} Plugin`);
  lines.push('');
  lines.push(`> ${manifest.description}`);
  lines.push('');
  lines.push('## Installation');
  lines.push('');
  lines.push('```bash');
  lines.push(`reactpilot plugin install ${manifest.name}`);
  lines.push('```');
  lines.push('');
  lines.push('## Metadata');
  lines.push('');
  lines.push(`| Field | Value |`);
  lines.push(`|---|---|`);
  lines.push(`| Version | \`${manifest.version}\` |`);
  lines.push(`| Author | ${manifest.author ?? '—'} |`);
  lines.push(`| ReactPilot | \`${manifest.reactpilotVersion}\` |`);
  lines.push(`| Permissions | ${manifest.permissions.join(', ') || 'none'} |`);
  if (manifest.homepage) lines.push(`| Homepage | [${manifest.homepage}](${manifest.homepage}) |`);
  lines.push('');

  if (rules.length > 0) {
    lines.push('## Analysis Rules');
    lines.push('');
    lines.push('| Rule | Severity | Description |');
    lines.push('|---|---|---|');
    for (const rule of rules) {
      lines.push(`| \`${rule.name}\` | ${rule.severity} | ${rule.description} |`);
    }
    lines.push('');
  }

  if (prompts.length > 0) {
    lines.push('## AI Prompts');
    lines.push('');
    for (const prompt of prompts) {
      lines.push(`### \`${prompt.name}\``);
      lines.push('');
      lines.push(prompt.description);
      if (prompt.variables?.length) {
        lines.push('');
        lines.push(`**Variables:** ${prompt.variables.map((v) => `\`${v}\``).join(', ')}`);
      }
      lines.push('');
    }
  }

  if (generators.length > 0) {
    lines.push('## Generators');
    lines.push('');
    lines.push('| Generator | Types | Description |');
    lines.push('|---|---|---|');
    for (const gen of generators) {
      lines.push(`| \`${gen.name}\` | ${gen.types.join(', ')} | ${gen.description} |`);
    }
    lines.push('');
  }

  if (reportSections.length > 0) {
    lines.push('## Report Sections');
    lines.push('');
    for (const section of reportSections) {
      lines.push(`- **${section.title}** (\`${section.name}\`)`);
    }
    lines.push('');
  }

  if (fixes.length > 0) {
    lines.push('## Auto-Fixes');
    lines.push('');
    lines.push('| Rule | Fix Description |');
    lines.push('|---|---|');
    for (const fix of fixes) {
      lines.push(`| \`${fix.ruleId}\` | ${fix.description} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

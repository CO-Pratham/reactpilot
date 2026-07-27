import type {
  PluginAPI,
  AnalysisRule,
  AIPrompt,
  Generator,
  ReportSection,
  CodeFix,
  RegisteredPlugin,
} from './types.js';

/**
 * PluginAPIImpl — implements PluginAPI, collecting all registrations
 * into the given RegisteredPlugin object.
 */
export class PluginAPIImpl implements PluginAPI {
  constructor(private readonly plugin: RegisteredPlugin) {}

  registerRule(rule: AnalysisRule): void {
    if (this.plugin.rules.some((r) => r.name === rule.name)) {
      this.plugin.context.log.warn(`Rule "${rule.name}" is already registered — skipping.`);
      return;
    }
    this.plugin.rules.push(rule);
    this.plugin.context.log.info(`Registered rule: ${rule.name}`);
  }

  registerPrompt(prompt: AIPrompt): void {
    if (this.plugin.prompts.some((p) => p.name === prompt.name)) {
      this.plugin.context.log.warn(`Prompt "${prompt.name}" is already registered — skipping.`);
      return;
    }
    this.plugin.prompts.push(prompt);
    this.plugin.context.log.info(`Registered prompt: ${prompt.name}`);
  }

  registerGenerator(generator: Generator): void {
    if (this.plugin.generators.some((g) => g.name === generator.name)) {
      this.plugin.context.log.warn(`Generator "${generator.name}" is already registered — skipping.`);
      return;
    }
    this.plugin.generators.push(generator);
    this.plugin.context.log.info(`Registered generator: ${generator.name}`);
  }

  registerReportSection(section: ReportSection): void {
    if (this.plugin.reportSections.some((s) => s.name === section.name)) {
      this.plugin.context.log.warn(`Report section "${section.name}" is already registered — skipping.`);
      return;
    }
    this.plugin.reportSections.push(section);
    this.plugin.context.log.info(`Registered report section: ${section.name}`);
  }

  registerFix(fix: CodeFix): void {
    if (this.plugin.fixes.some((f) => f.ruleId === fix.ruleId)) {
      this.plugin.context.log.warn(`Fix for rule "${fix.ruleId}" is already registered — skipping.`);
      return;
    }
    this.plugin.fixes.push(fix);
    this.plugin.context.log.info(`Registered fix for rule: ${fix.ruleId}`);
  }
}

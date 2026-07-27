import { describe, it, expect } from 'vitest';
import { PluginRegistry, PluginManifestSchema } from '../index.js';

describe('Plugin System Package', () => {
  it('should validate valid manifests', () => {
    const raw = {
      name: 'my-plugin',
      version: '1.0.0',
      description: 'Test plugin',
      main: 'index.js',
      permissions: ['fs'],
    };
    const result = PluginManifestSchema.safeParse(raw);
    expect(result.success).toBe(true);
  });

  it('should reject invalid names in manifest', () => {
    const raw = {
      name: 'My Plugin With Spaces',
      version: '1.0.0',
      description: 'Test plugin',
    };
    const result = PluginManifestSchema.safeParse(raw);
    expect(result.success).toBe(false);
  });

  it('should register and retrieve plugins correctly in registry', () => {
    const registry = PluginRegistry.getInstance();
    registry.clear();

    const mockPlugin: any = {
      manifest: { name: 'test-plugin', version: '1.0.0' },
      rules: [],
      prompts: [],
      generators: [],
      reportSections: [],
      fixes: [],
    };

    registry.register(mockPlugin);
    expect(registry.size).toBe(1);
    expect(registry.get('test-plugin')).toBeDefined();

    registry.unregister('test-plugin');
    expect(registry.size).toBe(0);
  });
});

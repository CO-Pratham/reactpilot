import { describe, it, expect } from 'vitest';
import { ReactPilotConfigSchema, defaultConfig } from '../index.js';

describe('ReactPilot Config Package', () => {
  it('should validate the default configuration successfully', () => {
    const result = ReactPilotConfigSchema.safeParse(defaultConfig);
    expect(result.success).toBe(true);
  });

  it('should apply defaults for missing fields', () => {
    const result = ReactPilotConfigSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.graph.theme).toBe('dark');
      expect(result.data.chat.provider).toBe('openai');
    }
  });

  it('should fail validation for invalid fields', () => {
    const result = ReactPilotConfigSchema.safeParse({
      chat: {
        provider: 'invalid-provider',
      },
    });
    expect(result.success).toBe(false);
  });
});

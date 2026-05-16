import { describe, expect, it } from 'vitest';
import { VERSION } from './index.js';

describe('VERSION', () => {
  it('exports 0.1.0', () => {
    expect(VERSION).toBe('0.1.0');
  });
});

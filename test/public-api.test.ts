import { describe, expect, it } from 'vitest';
import * as api from '../src/index.js';

describe('public API contract', () => {
  it('exports only the documented stable runtime surface', () => {
    expect(Object.keys(api).sort()).toEqual([
      'HttpExceptionFilter',
      'IS_PUBLIC_KEY',
      'Public',
      'ROLES_KEY',
      'Roles',
      'configureHttpApp',
      'createApp',
    ]);
  });
});

import { describe, expect, it } from 'vitest';
import { IS_PUBLIC_KEY, Public, ROLES_KEY, Roles } from '../src/index.js';

describe('metadata decorators', () => {
  it('attach public and role metadata for application guards', () => {
    class Controller {}
    Public()(Controller);
    Roles('admin', 'support')(Controller);

    expect(Reflect.getMetadata(IS_PUBLIC_KEY, Controller)).toBe(true);
    expect(Reflect.getMetadata(ROLES_KEY, Controller)).toEqual(['admin', 'support']);
  });
});

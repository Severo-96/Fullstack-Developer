import { describe, expect, it } from 'vitest';
import { isPresent, isStrongPassword, isValidEmail } from '../validators';

describe('validators', () => {
  it('validates email addresses', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
  });

  it('validates password strength', () => {
    expect(isStrongPassword('123456')).toBe(true);
    expect(isStrongPassword('12345')).toBe(false);
  });

  it('checks presence', () => {
    expect(isPresent('hello')).toBe(true);
    expect(isPresent('')).toBe(false);
    expect(isPresent('   ')).toBe(false);
  });
});


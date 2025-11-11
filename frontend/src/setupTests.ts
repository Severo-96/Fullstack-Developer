import '@testing-library/jest-dom/vitest';
import '@testing-library/jest-dom';
import 'whatwg-fetch';
import { afterEach, beforeEach, vi } from 'vitest';

const originalError = console.error;
const originalWarn = console.warn;

const suppressedErrorPatterns = [/not wrapped in act/, /Failed to refresh current user/];
const suppressedWarnPatterns = [/React Router Future Flag Warning/];

let errorSpy: ReturnType<typeof vi.spyOn<typeof console, 'error'>> | null = null;
let warnSpy: ReturnType<typeof vi.spyOn<typeof console, 'warn'>> | null = null;

beforeEach(() => {
  errorSpy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    const message = args[0]?.toString() ?? '';
    if (suppressedErrorPatterns.some((pattern) => pattern.test(message))) {
      return;
    }
    originalError(...(args as Parameters<typeof console.error>));
  });

  warnSpy = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
    const message = args[0]?.toString() ?? '';
    if (suppressedWarnPatterns.some((pattern) => pattern.test(message))) {
      return;
    }
    originalWarn(...(args as Parameters<typeof console.warn>));
  });
});

afterEach(() => {
  errorSpy?.mockRestore();
  warnSpy?.mockRestore();
});


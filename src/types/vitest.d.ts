
import { expect } from 'vitest';

interface CustomMatchers<R = unknown> {
  toBeDefined(): R;
  toBe(expected: any): R;
  toEqual(expected: any): R;
  toBeGreaterThan(expected: number): R;
  toBeGreaterThanOrEqual(expected: number): R;
  toBeLessThan(expected: number): R;
  toBeLessThanOrEqual(expected: number): R;
  toContain(expected: any): R;
  toHaveLength(expected: number): R;
  toBeInstanceOf(expected: any): R;
  resolves: any;
  rejects: any;
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

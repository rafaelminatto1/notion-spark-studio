
/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

declare global {
  namespace Vi {
    interface JestAssertion<T = any> {
      toBeDefined(): T;
      toBe(expected: any): T;
      toBeGreaterThan(expected: number): T;
      toBeGreaterThanOrEqual(expected: number): T;
      toContain(expected: any): T;
      toEqual(expected: any): T;
      toHaveLength(expected: number): T;
      toBeInstanceOf(expected: any): T;
    }
  }
}

export {};

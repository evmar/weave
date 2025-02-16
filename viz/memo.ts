/**
 * Memoization helper.
 */

function arrayEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function memo<T extends Function>(fn: T): T {
  let lastArgs: unknown[] = [];
  let lastValue: T | undefined = undefined;
  const memoed = function () {
    if (!arrayEqual(arguments as any as unknown[], lastArgs)) {
      lastArgs = [...arguments];
      lastValue = fn(...lastArgs);
    }
    return lastValue;
  };
  return memoed as unknown as T;
}

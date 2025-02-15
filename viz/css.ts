export function classNames(...classes: (string | Record<string, boolean> | undefined)[]): string {
  const strs = [];
  for (const c of classes) {
    if (typeof c === 'string') {
      strs.push(c);
    } else if (c) {
      strs.push(...Object.keys(c).filter((k) => c[k]));
    }
  }
  return strs.join(' ');
}

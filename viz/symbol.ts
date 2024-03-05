/**
 * Given a C++ function name, simplify it as appropriate for the treemap.
 * Parsing C++ function names correctly is very hard and this code is not correct,
 * but it does at least attempt to match parens and angle brackets as found in complex
 * C++ types.
 */
export function parseCPP(name: string): string[] {
  const stack = [];
  let letters = [];
  for (let i = 0; i < name.length; i++) {
    switch (name[i]) {
      case '(':
        stack.push(name[i]);
        continue;
      case '<':
        if (name[i + 1] !== '=') {
          // `<=`
          stack.push(name[i]);
          continue;
        }
        break;
      case ')':
        if (stack.pop() !== '(') throw new Error('failed to parse C++ symbol');
        if (stack.length === 0) letters.push('()');
        continue;
      case '>':
        if (name[i + 1] !== '=') {
          // `>=`
          if (stack.pop() !== '<') {
            throw new Error('failed to parse C++ symbol');
          }
          continue;
        }
        break;
      case '-':
        if (name[i + 1] === '>') {
          // `->`
          i++;
          if (stack.length === 0) letters.push('->');
          continue;
        }
        break;
    }
    if (stack.length === 0) {
      letters.push(name[i]);
    }
  }
  name = letters.join('');

  // name is now e.g. `foo::iterator bar::fn() const`
  // Rust name comes out like `mangled$gibberish ()` so avoid that in particular.
  let parts = name.split(' ').filter((part) => part !== '()');
  let fn = parts.find((part) => part.endsWith('()') && part !== 'decltype()');
  if (fn) {
    fn = fn.slice(0, -2);
  } else {
    // Fallback when we didn't find a function.
    fn = parts[parts.length - 1];
  }
  return fn.split('::');
}

export function parseRust(name: string): string[] {
  const stack: Array<[string, string]> = [['', '']];
  for (let i = 0; i < name.length; i++) {
    const c = name[i];
    switch (c) {
      case '<':
        stack.push([c, '']);
        break;
      case '>':
        let [bracket, text] = stack.pop()!;
        if (bracket != '<') {
          throw new Error('<> mismatch');
        }
        const match = text.match(/(.*?) as (.*?)/);
        if (match) {
          text = match[1];
        }
        stack[stack.length - 1][1] += text;
        break;
      default:
        stack[stack.length - 1][1] += c;
    }
  }
  name = stack[0][1];

  const parts = name.split('::');
  const last = parts[parts.length - 1];
  if (/h[0-9a-f]{16}/.test(last)) {
    parts.pop();
  }
  return parts;
}

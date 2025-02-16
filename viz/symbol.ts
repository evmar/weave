/**
 * Symbol munging.  Symbols are already demangled by the wasm toolchains, but we
 * parse them further to make them hierarchical for the treemap.
 */

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

type Part = string | Part[];
export function parseRust(name: string): string[] {
  let ns = /::/y;
  let ident = /[^:<> ]+/y;
  let as = / as /y;
  let i = 0;
  function parse(): Part[] {
    const parts: Part[] = [];
    while (i < name.length) {
      let match;
      if (name[i] === '<') {
        i++;
        const p = parse();
        if (name[i] !== '>') {
          throw new Error('parse error');
        }
        i++;
        parts.push(p);
      } else if (name[i] === '>') {
        return parts;
      } else if (ns.lastIndex = i, ns.test(name)) {
        i = ns.lastIndex;
      } else if (ident.lastIndex = i, match = ident.exec(name)) {
        i = ident.lastIndex;
        parts.push(match[0]);
      } else if (as.lastIndex = i, as.test(name)) {
        i = as.lastIndex;
        const rest = parse();
      } else {
        throw new Error('parse fail');
      }
    }
    return parts;
  }

  let parts = parse();
  if (typeof parts[0] !== 'string') {
    // <foo as bar>::baz => foo::baz
    parts = parts[0].concat(parts.slice(1));
  }

  function flatten(part: Part): string {
    if (typeof part === 'string') return part;
    return '<' + part.map((p) => flatten(p)).join('::') + '>';
  }
  let flat = parts.map(flatten);
  const last = flat[flat.length - 1];
  if (/h[0-9a-f]{16}/.test(last)) {
    flat.pop();
  }
  return flat;
}

import * as d3 from 'd3';
import { Fragment, h } from 'preact';
import * as preact from 'preact';
import * as preactCompat from 'preact/compat';
import * as wasmCode from 'wasm/code';
import * as webtreemap from 'webtreemap/build/webtreemap';
import { Indexed } from './viz';

/**
 * Given a C++ function name, simplify it as appropriate for the treemap.
 * Parsing C++ function names correctly is very hard and this code is not correct,
 * but it does at least attempt to match parens and angle brackets as found in complex
 * C++ types.
 */
function simplifyCPPName(name: string): string[] {
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

// Some test cases, if we ever add a test suite:
// console.log(simplifyCPPName('(anonymous namespace)::itanium_demangle::NameType* (anonymous namespace)::DefaultAllocator::makeNode<(anonymous namespace)::itanium_demangle::NameType, char const (&) [14]>(char const (&) [14])'));
// console.log(simplifyCPPName("std::__2::__hash_const_iterator<std::__2::__hash_node<char const*, void*>*> std::__2::__hash_table<char const*, Json::ValueAllocator::InternHash, Json::ValueAllocator::InternHash, std::__2::allocator<char const*> >::find<char const*>(char const* const&) const"));
// console.log(simplifyCPPName("_$LT$alloc..alloc..Global$u20$as$u20$core..alloc..Allocator$GT$::deallocate::h24852c13dde43f03 (.103)"));
// console.log(simplifyCPPName("decltype(((hb_forward<unsigned int&>(fp)) <= (hb_forward<unsigned int&>(fp0))) ? (hb_forward<unsigned int&>(fp)) : (hb_forward<unsigned int&>(fp0))) $_4::operator()<unsigned int&, unsigned int&>(unsigned int&, unsigned int&) const"));

export function showCodeTreemap(
  headers: Indexed<wasmCode.FunctionHeader>[],
  nameMap: Map<number, string>,
) {
  const root = new FunctionNode('code');

  let nameToPath = (name: string) => name.split('.');
  const names = Array.from(nameMap.values());
  if (names.includes('go.buildid')) {
    // Likely Go binary
    nameToPath = (name: string) => name.split(/[._:]/);
  } else if (names.some((name) => name.startsWith('std::'))) {
    // Likely C++ binary
    nameToPath = simplifyCPPName;
  }

  for (const header of headers) {
    const name = nameMap.get(header.index);
    let path = ['unknown', String(header.index)];
    try {
      if (name) {
        const parsed = nameToPath(name).filter((p) => p);
        if (parsed.length === 0) {
          console.error(`BUG: failed to simplify ${name}`);
        } else {
          path = parsed;
        }
      }
    } catch (err: unknown) {
      console.error(`parsing ${JSON.stringify(name)}: ${err}`);
    }
    root.addFunction(header, path);
  }
  root.sort();

  const container = document.createElement('div');
  container.className = 'code-treemap-container';
  document.body.appendChild(container);
  preact.render(
    <Treemap
      root={root}
      onDone={() => {
        preactCompat.unmountComponentAtNode(container);
        container.remove();
      }}
    />,
    container,
  );
}

interface TreemapProps {
  root: webtreemap.Node;
  onDone: () => void;
}

class Treemap extends preact.Component<TreemapProps> {
  containerRef = preact.createRef();

  render() {
    const { onDone } = this.props;
    return (
      <>
        <button className='code-treemap-done' onClick={onDone}>
          ❌
        </button>
        <div className='code-treemap' ref={this.containerRef} />
      </>
    );
  }

  componentDidMount() {
    const { current: container } = this.containerRef;
    if (!container) {
      return;
    }
    const { root } = this.props;
    webtreemap.render(container, root, {
      caption(node) {
        return `${node.id} (${d3.format(',')(node.size)})`;
      },
    });
  }
}
class FunctionNode implements webtreemap.Node {
  id: string;
  size: number;
  children: webtreemap.Node[] = [];
  childrenByName = new Map<string, FunctionNode>();

  constructor(id: string, size: number = 0) {
    this.id = id;
    this.size = size;
  }

  addFunction(func: wasmCode.FunctionHeader, path: string[]) {
    this.size += func.len;
    if (path.length === 1) {
      const child = new FunctionNode(path[0], func.len);
      this.children.push(child);
      return;
    }
    const [head, ...tail] = path;
    let child = this.childrenByName.get(head);
    if (!child) {
      child = new FunctionNode(head);
      this.children.push(child);
      this.childrenByName.set(head, child);
    }
    child.addFunction(func, tail);
  }

  sort() {
    this.children.sort((a, b) => d3.descending(a.size, b.size));
    for (const child of this.childrenByName.values()) {
      child.sort();
    }
  }
}

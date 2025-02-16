import * as d3 from 'd3';
import { Fragment, h } from 'preact';
import * as preact from 'preact';
import * as preactCompat from 'preact/compat';
import * as wasmCode from 'wasm/code';
import * as webtreemap from 'webtreemap/build/webtreemap';
import * as symbol from './symbol';
import { Indexed, Toolchain } from './module';

export function showCodeTreemap(
  toolchain: Toolchain,
  headers: Indexed<wasmCode.FunctionHeader>[],
  nameMap: Map<number, string>,
) {
  const root = new FunctionNode('code');

  let nameToPath = (name: string) => name.split('.');
  switch (toolchain) {
    case 'Go':
      nameToPath = (name: string) => name.split(/[._:]/);
      break;
    case 'Rust':
      nameToPath = symbol.parseRust;
      break;
    default:
      for (const name of nameMap.values()) {
        if (name.startsWith('std::')) {
          // Likely C++ binary
          nameToPath = symbol.parseCPP;
          break;
        }
      }
  }

  for (const header of headers) {
    const name = nameMap.get(header.index);
    if (!name) {
      root.addFunction(header, ['no name', `${header.index}`], `noname ${header.index}`);
      return;
    }
    let path;
    try {
      const parsed = nameToPath(name).filter((p) => p);
      if (parsed.length === 0) {
        console.error(`BUG: failed to simplify ${name}`);
      } else {
        path = parsed;
      }
    } catch (err: unknown) {
      console.error(`parsing ${JSON.stringify(name)}: ${err}`);
    }
    if (!path) {
      path = ['parse failure', name];
    }
    root.addFunction(header, path, name);
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
        let caption = `${node.id} (${d3.format(',')(node.size)})`;
        const fn = node as FunctionNode;
        if (fn.originalName && fn.originalName !== node.id) {
          caption += `\n${(node as FunctionNode).originalName}`;
        }
        return caption;
      },
    });
  }
}
class FunctionNode implements webtreemap.Node {
  constructor(readonly id: string, readonly originalName?: string, public size: number = 0) {
  }

  children: webtreemap.Node[] = [];
  childrenByName = new Map<string, FunctionNode>();

  addFunction(func: wasmCode.FunctionHeader, path: string[], originalName: string) {
    this.size += func.len;
    const [head, ...tail] = path;
    if (tail.length === 0) {
      const child = new FunctionNode(head, originalName, func.len);
      this.children.push(child);
      return;
    }
    let child = this.childrenByName.get(head);
    if (!child) {
      child = new FunctionNode(head);
      this.children.push(child);
      this.childrenByName.set(head, child);
    }
    child.addFunction(func, tail, originalName);
  }

  sort() {
    this.children.sort((a, b) => d3.descending(a.size, b.size));
    for (const child of this.childrenByName.values()) {
      child.sort();
    }
  }
}

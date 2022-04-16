import { FunctionRef, Indexed, ParsedModule } from './viz';
import * as wasmCode from 'wasm/code';
import * as preact from 'preact';
import { h, Fragment } from 'preact';
import * as hooks from 'preact/hooks';
import * as d3 from 'd3';

export namespace Instructions {
  export interface Props {
    module: ParsedModule;
    instrs: wasmCode.Instruction[];
  }
  export interface State {
    expanded: boolean;
  }
}
export class Instructions extends preact.Component<
  Instructions.Props,
  Instructions.State
> {
  state = { expanded: false };

  private expand = () => {
    this.setState({ expanded: true });
  };

  render() {
    const lines = [];
    let expand;
    for (const line of this.renderInstrs(this.props.instrs)) {
      lines.push(line);
      if (lines.length >= 50 && !this.state.expanded) {
        expand = (
          <div>
            {'\n'}
            <button onClick={this.expand}>show all</button>
          </div>
        );
        break;
      }
    }

    return (
      <pre style="white-space: pre-wrap">
        {lines}
        {expand}
      </pre>
    );
  }

  private renderGlobal(index: number) {
    const fallback = `global ${index}`;
    const name = this.props.module.globalNames.get(index);
    if (name) {
      return <span title={fallback}>{name}</span>;
    }
    return fallback;
  }

  private *renderInstr(
    instr: wasmCode.Instruction,
    indent = 0
  ): Generator<preact.ComponentChild> {
    switch (instr.op) {
      case wasmCode.Instr.block:
        // Render nothing.
        break;
      case wasmCode.Instr.call:
        yield (
          <div>
            {'  '.repeat(indent)}
            {instr.op}{' '}
            <FunctionRef module={this.props.module} index={instr.func} />
          </div>
        );
        break;

      case wasmCode.Instr.global_get:
      case wasmCode.Instr.global_set:
        yield (
          <div>
            {'  '.repeat(indent)}
            {instr.op} {this.renderGlobal(instr.global)}
          </div>
        );
        break;
      // TODO: custom rendering here.
      default:
        const toPrint = [instr.op.toString()];
        for (const [key, val] of Object.entries(instr)) {
          if (key === 'op') continue;
          if (val instanceof Array) continue;
          toPrint.push(` ${key}=${val}`);
        }
        yield (
          <div>
            {'  '.repeat(indent)}
            {toPrint.join('')}
            {'\n'}
          </div>
        );
    }

    // Render bodies of block instructions.
    switch (instr.op) {
      case wasmCode.Instr.if:
        yield* this.renderInstrs(instr.body, indent + 1);
        if (instr.else) {
          yield (
            <div>
              {'  '.repeat(indent)}
              {'else'}
            </div>
          );
          yield* this.renderInstrs(instr.else, indent + 1);
        }
        break;
      case wasmCode.Instr.block:
        yield* this.renderInstrs(instr.body, indent);
        break;
      case wasmCode.Instr.loop:
        yield* this.renderInstrs(instr.body, indent + 1);
        break;
    }
  }

  private *renderInstrs(instrs: wasmCode.Instruction[], indent = 0) {
    for (const instr of instrs) {
      yield* this.renderInstr(instr, indent);
    }
  }
}

export function Function(props: {
  module: ParsedModule;
  func: Indexed<wasmCode.Function>;
  name?: string;
}) {
  return (
    <>
      <b>
        function {props.func.index} {props.name} {props.func.size}:
      </b>
      <Instructions module={props.module} instrs={props.func.body} />
    </>
  );
}

interface CodeProps {
  children: Indexed<wasmCode.Function>[];
  functionNames: Map<number, string>;
  onClick: (func: Indexed<wasmCode.Function>) => void;
}
export function Code(props: CodeProps) {
  const [expanded, setExpanded] = hooks.useState(false);
  const [sortBy, setSortBy] = hooks.useState<undefined | 'name' | 'size'>(
    undefined
  );
  const totalSize = hooks.useMemo(
    () => d3.sum(props.children.map((f) => f.size)),
    props.children
  );

  const funcs = hooks.useMemo(() => {
    let funcs = [...props.children];
    if (sortBy === 'name') {
      //funcs.sort((a, b) => d3.ascending(a.name, b.name));
    } else if (sortBy === 'size') {
      funcs.sort((a, b) => d3.descending(a.size, b.size));
    }
    if (!expanded) {
      funcs = funcs.slice(0, 100);
    }
    return funcs;
  }, [props.children, sortBy, expanded]);

  return (
    <table cellSpacing="0" cellPadding="0">
      <thead>
        <tr>
          <th className="right pointer" onClick={() => setSortBy(undefined)}>
            index
          </th>
          <th className="pointer" onClick={() => setSortBy('name')}>
            name
          </th>
          <th className="right pointer" onClick={() => setSortBy('size')}>
            size
          </th>
          <th className="right">%</th>
        </tr>
      </thead>
      <tbody>
        {funcs.map((f) => (
          <tr className="pointer hover" onClick={() => props.onClick(f)}>
            <td className="right">{f.index}</td>
            <td className="break-all">
              <code>{props.functionNames.get(f.index)}</code>
            </td>
            <td className="right">{d3.format(',')(f.size)}</td>
            <td className="right">{d3.format('.1%')(f.size / totalSize)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

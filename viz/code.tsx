import { FunctionRef, Indexed, ParsedModule } from "./viz";
import * as wasmCode from 'wasm/code';
import * as preact from 'preact';
import { h, Fragment } from 'preact';
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
interface CodeState {
  totalSize: number;
  funcs: Indexed<wasmCode.Function>[];
}
export class Code extends preact.Component<CodeProps, CodeState> {
  state = { totalSize: 0, funcs: [] };
  static getDerivedStateFromProps(props: CodeProps): object {
    const totalSize = d3.sum(props.children.map((f) => f.size));
    const funcs = d3
      .sort(props.children, (f1, f2) => d3.descending(f1.size, f2.size))
      .slice(0, 100);
    return { totalSize, funcs };
  }
  render(props: CodeProps, state: CodeState) {
    return (
      <table>
        <thead>
          <tr>
            <th className="right">index</th>
            <th>name</th>
            <th className="right">size</th>
            <th className="right">%</th>
          </tr>
        </thead>
        <tbody>
          {state.funcs.map((f) => (
            <tr className="pointer" onClick={() => props.onClick(f)}>
              <td className="right">{f.index}</td>
              <td className="break-all">
                <code>{props.functionNames.get(f.index)}</code>
              </td>
              <td className="right">{d3.format(',')(f.size)}</td>
              <td className="right">
                {d3.format('.1%')(f.size / state.totalSize)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}

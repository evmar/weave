import {
  Function,
  FunctionRef,
  GlobalRef,
  Indexed,
  Screen,
  ParsedModule,
} from './viz';
import * as wasmCode from 'wasm/code';
import * as preact from 'preact';
import { h, Fragment } from 'preact';
import * as hooks from 'preact/hooks';
import * as d3 from 'd3';
import { Column, Table } from './table';
import { Reader } from 'wasm/reader';
import { funcTypeToString } from 'wasm';

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
      <pre style='white-space: pre-wrap'>
        {lines}
        {expand}
      </pre>
    );
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
            {instr.op}{' '}
            <GlobalRef module={this.props.module} index={instr.global} />
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
  func: Indexed<Function>;
  name?: string;
}) {
  const funcBody = wasmCode.readFunction(
    new Reader(new DataView(props.module.bytes, props.func.ofs, props.func.len))
  );
  const type = props.module.types[props.func.typeidx];
  return (
    <section>
      <h2>
        function {props.func.index}: {props.name}
      </h2>
      <div>params: ({type.params.map((p) => p).join(', ')})</div>
      {type.result.length > 0 && (
        <div>result: ({type.result.map((p) => p).join(', ')})</div>
      )}
      <div>locals: {funcBody.locals.join(' ')}</div>
      <Instructions module={props.module} instrs={funcBody.body} />
    </section>
  );
}

interface CodeProps {
  module: ParsedModule;
  children: Indexed<wasmCode.FunctionHeader>[];
  functionNames: Map<number, string>;
  onClick: (func: number) => void;
}
export function CodeSection(props: CodeProps) {
  const totalSize = hooks.useMemo(
    () => d3.sum(props.children.map((f) => f.len)),
    props.children
  );

  const columns: Column<Indexed<wasmCode.FunctionHeader>>[] = [
    { name: 'index', className: 'right', sort: null, data: (f) => f.index },
    {
      name: 'name',
      cellClass: 'break-all',
      data: (f) => <code>{props.functionNames.get(f.index)}</code>,
    },
    {
      name: 'size',
      className: 'right',
      sort: (a, b) => d3.descending(a.len, b.len),
      data: (f) => d3.format(',')(f.len),
    },
    {
      name: '%',
      className: 'right',
      data: (f) => d3.format('.1%')(f.len / totalSize),
    },
  ];

  return (
    <Screen module={props.module} title='"code" section'>
      <p>Function bodies.</p>
      <Table columns={columns} onClick={(func) => props.onClick(func.index)}>
        {props.children}
      </Table>
    </Screen>
  );
}

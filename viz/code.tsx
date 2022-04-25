import {
  Function,
  FunctionRef,
  GlobalRef,
  Indexed,
  Screen,
  ParsedModule,
  InlineEdit,
} from './viz';
import * as wasmCode from 'wasm/code';
import * as preact from 'preact';
import { h, Fragment } from 'preact';
import * as hooks from 'preact/hooks';
import * as d3 from 'd3';
import { Column, Table } from './table';
import { Reader } from 'wasm/reader';
import { funcTypeToString } from 'wasm';

interface Highlight {
  kind: 'local';
  index: number;
}

function LocalRef(props: {
  className?: string;
  names?: Map<number, string>;
  index: number;
}) {
  const name = props.names?.get(props.index);
  if (name) {
    return (
      <span className={props.className} title={`locals[${props.index}]`}>
        ${name}
      </span>
    );
  }
  return <span className={props.className}>locals[{props.index}]</span>;
}

export namespace Instructions {
  export interface Props {
    module: ParsedModule;
    localNames?: Map<number, string>;
    instrs: wasmCode.Instruction[];
    highlight?: Highlight;
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
      <>
        <pre style='white-space: pre-wrap'>{lines}</pre>
        {expand}
      </>
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

      case wasmCode.Instr.local_get:
      case wasmCode.Instr.local_set:
      case wasmCode.Instr.local_tee: {
        let className: string | undefined;
        if (
          this.props.highlight &&
          this.props.highlight.kind === 'local' &&
          this.props.highlight.index === instr.local
        ) {
          className = 'highlight';
        }
        yield (
          <div>
            {'  '.repeat(indent)}
            {instr.op}{' '}
            <LocalRef
              className={className}
              names={this.props.localNames}
              index={instr.local}
            />
          </div>
        );
        break;
      }
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

function EditableLocal(props: {
  name: string;
  onHover: () => void;
  onEdit: (newText: string) => void;
}) {
  return (
    <span className='flex-container' onMouseOver={props.onHover}>
      <InlineEdit onEdit={props.onEdit}>{props.name}</InlineEdit>
    </span>
  );
}

export function Function(props: {
  module: ParsedModule;
  func: Indexed<Function>;
  name?: string;
}) {
  const funcBody = wasmCode.readFunction(
    new Reader(new DataView(props.module.bytes, props.func.ofs, props.func.len))
  );
  const funcType = props.module.types[props.func.typeidx];
  const [localNames, setLocalNames] = hooks.useState<Map<number, string>>(
    () => {
      const localNames = new Map();
      let index = 0;
      for (const param of funcType.params) {
        localNames.set(index, `param${index}`);
        index++;
      }
      for (const local of funcBody.locals) {
        localNames.set(index, `local${index}`);
        index++;
      }
      return localNames;
    }
  );
  const nameLocal = (index: number, name: string) => {
    setLocalNames(new Map(localNames.set(index, name)));
  };
  const [highlight, setHighlight] = hooks.useState<Highlight | undefined>(
    undefined
  );
  return (
    <Screen module={props.module} title={`function ${props.func.index}`}>
      <table>
        <tr>
          <th className='right'>name</th>
          <td>{props.name}</td>
        </tr>
        {funcType.params.length > 0 && (
          <tr>
            <th className='right'>params</th>
            <td>
              {funcType.params.map((type, index) => (
                <div class='flex-container'>
                  {type}&nbsp;
                  <EditableLocal
                    name={localNames.get(index) ?? ''}
                    onHover={() => setHighlight({ kind: 'local', index })}
                    onEdit={(name) => nameLocal(index, name)}
                  />
                </div>
              ))}
            </td>
          </tr>
        )}
        {funcType.result.length > 0 && (
          <tr>
            <th className='right'>result</th>
            <td>{funcType.result.map((p) => p).join(', ')}</td>
          </tr>
        )}
        {funcBody.locals.length > 0 && (
          <tr>
            <th className='right'>locals</th>
            <td>
              {funcBody.locals.map((type, i) => {
                const index = i + funcType.params.length;
                return (
                  <div class='flex-container'>
                    {type}&nbsp;
                    <EditableLocal
                      name={localNames.get(index) ?? ''}
                      onHover={() => setHighlight({ kind: 'local', index })}
                      onEdit={(name) => nameLocal(index, name)}
                    />
                  </div>
                );
              })}
            </td>
          </tr>
        )}
      </table>
      <Instructions
        module={props.module}
        localNames={localNames}
        instrs={funcBody.body}
        highlight={highlight}
      />
    </Screen>
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

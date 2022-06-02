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
import { showCodeTreemap } from './code-treemap';

function XRef(props: {
  id: string;
  names?: Map<string, string>;
  highlight?: string;
  onHighlight?: (id: string) => void;
}) {
  const name = props.names?.get(props.id) ?? props.id;
  return (
    <span
      className={props.highlight === props.id ? 'highlight' : undefined}
      title={props.id}
      onMouseEnter={() => props.onHighlight?.(props.id)}
    >
      {name}
    </span>
  );
}

export namespace Instructions {
  export interface Props {
    module: ParsedModule;
    localNames?: Map<string, string>;
    instrs: wasmCode.Instruction[];
    highlight?: string;
    onHighlight?: (id: string) => void;
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

  /** Maps label number => ref count of label. */
  labelRefCounts: number[] = [];
  /** Stack of label numbers based on nesting. */
  labelStack: number[] = [];
  nextLabel = 0;

  private expand = () => {
    this.setState({ expanded: true });
  };

  render() {
    const lines = [];
    let expand;
    this.labelStack = [];
    this.nextLabel = 0;
    this.addLabel();
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
        <pre class='code'>{lines}</pre>
        {expand}
      </>
    );
  }

  private addLabel(): number {
    const label = this.nextLabel++;
    this.labelStack.push(label);
    this.labelRefCounts[label] = 0;
    return label;
  }

  /** Returns a reference to a label, as found in a `br` etc. instruction. */
  private labelRef(stackIndex: number): preact.ComponentChild {
    const label = this.labelStack[this.labelStack.length - stackIndex - 1];
    this.labelRefCounts[label]++;
    return (
      <XRef
        id={`label${label}`}
        highlight={this.props.highlight}
        onHighlight={this.props.onHighlight}
      />
    );
  }

  private labelTarget(label: number): preact.ComponentChild {
    // TODO: hide label if refCount == 0.
    return (
      <div class='label'>
        <XRef
          id={`label${label}`}
          highlight={this.props.highlight}
          onHighlight={this.props.onHighlight}
        />
        :
      </div>
    );
  }

  private *renderInstr(
    instr: wasmCode.Instruction,
    indent = 0
  ): Generator<preact.ComponentChild> {
    switch (instr.op) {
      case wasmCode.Instr.block: {
        const label = this.addLabel();
        yield* this.renderInstrs(instr.body, indent);
        yield this.labelTarget(label);
        this.labelStack.pop();
        break;
      }

      case wasmCode.Instr.loop: {
        const label = this.addLabel();
        yield <div style={`padding-left: ${indent * 2}ch`}>loop</div>;
        yield this.labelTarget(label);
        yield* this.renderInstrs(instr.body, indent + 1);
        this.labelStack.pop();
        break;
      }

      case wasmCode.Instr.if: {
        const label = this.addLabel();
        yield <div style={`padding-left: ${indent * 2}ch`}>if</div>;
        yield* this.renderInstrs(instr.body, indent + 1);
        if (instr.else) {
          yield <div style={`padding-left: ${indent * 2}ch`}>{'else'}</div>;
          yield* this.renderInstrs(instr.else, indent + 1);
        }
        yield this.labelTarget(label);
        this.labelStack.pop();
        break;
      }

      case wasmCode.Instr.call:
        yield (
          <div style={`padding-left: ${indent * 2}ch`}>
            {instr.op}{' '}
            <FunctionRef module={this.props.module} index={instr.func} />
          </div>
        );
        break;

      case wasmCode.Instr.global_get:
      case wasmCode.Instr.global_set:
        yield (
          <div style={`padding-left: ${indent * 2}ch`}>
            {instr.op}{' '}
            <GlobalRef module={this.props.module} index={instr.global} />
          </div>
        );
        break;

      case wasmCode.Instr.local_get:
      case wasmCode.Instr.local_set:
      case wasmCode.Instr.local_tee:
        yield (
          <div style={`padding-left: ${indent * 2}ch`}>
            {instr.op} $
            <XRef
              id={`local${instr.local}`}
              names={this.props.localNames}
              highlight={this.props.highlight}
              onHighlight={this.props.onHighlight}
            />
          </div>
        );
        break;

      case wasmCode.Instr.br:
      case wasmCode.Instr.br_if: {
        const target = instr.label;
        yield (
          <div style={`padding-left: ${indent * 2}ch`}>
            {instr.op} {this.labelRef(target)}
          </div>
        );
        break;
      }
      case wasmCode.Instr.br_table:
        yield (
          <div style={`padding-left: ${indent * 2}ch`}>
            {instr.op}{' '}
            {instr.labels.map((target, i) => {
              const label = this.labelRef(target);
              return (
                <span>
                  {i}=&gt;{label}{' '}
                </span>
              );
            })}{' '}
            else=&gt;
            {this.labelRef(instr.default)}
          </div>
        );
        break;

      case wasmCode.Instr.i32_const:
      case wasmCode.Instr.i64_const:
        yield (
          <div style={`padding-left: ${indent * 2}ch`}>
            {instr.op} {instr.n}
          </div>
        );
        break;
      case wasmCode.Instr.f32_const:
      case wasmCode.Instr.f64_const:
        yield (
          <div style={`padding-left: ${indent * 2}ch`}>
            {instr.op} {instr.z}
          </div>
        );
        break;

      default:
        const toPrint = [instr.op.toString()];
        for (const [key, val] of Object.entries(instr)) {
          if (key === 'op') continue;
          if (val instanceof Array) continue;
          toPrint.push(` ${key}=${val}`);
        }
        yield (
          <div style={`padding-left: ${indent * 2}ch`}>
            {toPrint.join('')}
            {'\n'}
          </div>
        );
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
  const [localNames, setLocalNames] = hooks.useState<Map<string, string>>(
    () => {
      const localNames = new Map<string, string>();
      let index = 0;
      for (const param of funcType.params) {
        localNames.set(`local${index}`, `param${index}`);
        index++;
      }
      for (const local of funcBody.locals) {
        localNames.set(`local${index}`, `local${index}`);
        index++;
      }
      return localNames;
    }
  );
  const nameLocal = (id: string, name: string) => {
    setLocalNames(new Map(localNames.set(id, name)));
  };
  const [highlight, setHighlight] = hooks.useState<string | undefined>(
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
              {funcType.params.map((type, index) => {
                const id = `local${index}`;
                return (
                  <div class='flex-container'>
                    {type}&nbsp;
                    <EditableLocal
                      name={localNames.get(id) ?? ''}
                      onHover={() => setHighlight(id)}
                      onEdit={(name) => nameLocal(id, name)}
                    />
                  </div>
                );
              })}
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
                const id = `local${index}`;
                return (
                  <div class='flex-container'>
                    {type}&nbsp;
                    <EditableLocal
                      name={localNames.get(id) ?? ''}
                      onHover={() => setHighlight(id)}
                      onEdit={(name) => nameLocal(id, name)}
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
        onHighlight={setHighlight}
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
      <p>
        Function bodies.{' '}
        <button
          onClick={() => showCodeTreemap(props.children, props.functionNames)}
        >
          View Treemap
        </button>
      </p>

      <Table columns={columns} onClick={(func) => props.onClick(func.index)}>
        {props.children}
      </Table>
    </Screen>
  );
}

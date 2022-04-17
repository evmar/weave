import * as wasm from 'wasm';
import * as wasmCode from 'wasm/code';
import * as preact from 'preact';
import { h, Fragment } from 'preact';
import * as hooks from 'preact/hooks';

import { Sections } from './sections';
import { DataSection, DataHex } from './data';
import { Code, Function, Instructions } from './code';
import { Column, Table } from './table';
import { Exports, Imports } from './impexp';

export type Indexed<T> = T & { index: number };
export interface Function {
  typeidx: number;
  ofs: number;
  len: number;
}
export interface ParsedModule {
  bytes: ArrayBuffer;
  sections: (wasm.SectionHeader & { name?: string })[];

  types: wasm.FuncType[];
  imports: Indexed<wasm.Import>[];
  exports: wasm.Export[];
  functions: Indexed<Function>[];
  names?: wasm.NameSection;
  data: Indexed<wasm.DataSectionData>[];
  globals: Indexed<wasm.Global>[];

  functionNames: Map<number, string>;
  globalNames: Map<number, string>;
}

type Link = [target: string, index: number];
function urlFromLink([target, index]: Link): string {
  let url = `#${target}=${index}`;
  return url;
}
function linkFromHash(hash: string): Link {
  const parts = hash.substring(1).split('=');
  return [parts[0], parseInt(parts[1])];
}
function go(link: Link) {
  window.location.hash = urlFromLink(link);
}
function Link(props: {
  target: Link;
  title?: string;
  children: preact.ComponentChildren;
}) {
  return (
    <a title={props.title} href={urlFromLink(props.target)}>
      {props.children}
    </a>
  );
}

export function FunctionRef(props: { module: ParsedModule; index: number }) {
  return (
    <Link title={`function ${props.index}`} target={['function', props.index]}>
      {props.module.functionNames.get(props.index) ?? `function ${props.index}`}
    </Link>
  );
}

export function GlobalRef(props: { module: ParsedModule; index: number }) {
  const sec = props.module.sections.find(
    (sec) => sec.type === wasm.SectionType.global
  )!;

  return (
    <Link title={`global ${props.index}`} target={['section', sec.index]}>
      {props.module.globalNames.get(props.index) ?? `global ${props.index}`}
    </Link>
  );
}

export function FunctionType(props: { type: wasm.FuncType }) {
  return <code>{wasm.funcTypeToString(props.type)}</code>;
}

function TypeSection(props: { module: ParsedModule }) {
  const columns: Column<Indexed<wasm.FuncType>>[] = [
    { name: 'index', className: 'right', data: (row) => row.index },
    {
      name: 'type',
      cellClass: 'break-all',
      data: (type) => <FunctionType type={type} />,
    },
  ];
  return (
    <Table columns={columns}>
      {props.module.types.map((t, i) => ({ ...t, index: i }))}
    </Table>
  );
}

export function InlineEdit(props: {
  onEdit: (newText: string) => void;
  children: string;
}) {
  const [editing, setEditing] = hooks.useState(false);
  const input = hooks.useRef<HTMLInputElement>(null);
  hooks.useEffect(() => {
    if (editing) input.current!.focus();
  }, [editing]);
  const commit = (ev: Event) => {
    if (!input.current) return;
    props.onEdit(input.current?.value ?? '');
    setEditing(false);
    ev.preventDefault();
    return false;
  };

  if (editing) {
    return (
      <form onSubmit={commit}>
        <input
          ref={input}
          size={1}
          type='text'
          className='inline'
          onfocusout={commit}
          value={props.children}
        />
      </form>
    );
  } else {
    return (
      <span onClick={() => setEditing(true)}>
        {props.children} <button className='edit'>{'\u270e'}</button>
      </span>
    );
  }
}

function Global(props: { module: ParsedModule }) {
  const [edited, setEdited] = hooks.useState(0);

  return (
    <table>
      <thead>
        <tr>
          <th className='right'>index</th>
          <th>name</th>
          <th>type</th>
          <th>init</th>
        </tr>
      </thead>
      <tbody>
        {props.module.globals.map((global) => {
          return (
            <tr>
              <td className='right'>{global.index}</td>
              <td className='break-all'>
                <InlineEdit
                  onEdit={(name) => {
                    props.module.globalNames.set(global.index, name);
                    setEdited(edited + 1);
                  }}
                >
                  {props.module.globalNames.get(global.index) ?? ''}
                </InlineEdit>
              </td>
              <td>
                {global.type.mut ? 'var' : 'const'} {global.type.valType}
              </td>
              <td>
                <Instructions module={props.module} instrs={global.init} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function FunctionSection(props: { module: ParsedModule }) {
  const columns: Column<Indexed<Function>>[] = [
    { name: 'func', className: 'right', data: (row) => row.index },
    {
      name: 'type',
      data: (row) => (
        <code>{wasm.funcTypeToString(props.module.types[row.typeidx])}</code>
      ),
    },
  ];
  return <Table columns={columns}>{props.module.functions}</Table>;
}

interface AppProps {
  module: ParsedModule;
}
interface AppState {
  section?: wasm.SectionHeader & { name?: string };
  func?: Indexed<Function>;
  data?: Indexed<wasm.DataSectionData>;
}
class App extends preact.Component<AppProps, AppState> {
  state: AppState = {};

  private onHashChange = () => {
    const [target, index] = linkFromHash(document.location.hash);
    if (target === 'section') {
      const section = this.props.module.sections.find(
        (sec) => sec.index === index
      );
      if (section) {
        this.setState({ section, func: undefined });
      }
    } else if (target === 'function') {
      const importedCount = this.props.module.imports.filter(
        (imp) => imp.desc.type === wasm.DescType.typeidx
      ).length;
      if (index < importedCount) {
        const section = this.props.module.sections.find(
          (sec) => sec.type === wasm.SectionType.import
        );
        if (section) {
          this.setState({ section, func: undefined, data: undefined });
        }
      } else {
        const func = this.props.module.functions[index - importedCount];
        if (func) {
          this.setState({ section: undefined, func, data: undefined });
        }
      }
    } else if (target === 'data') {
      this.setState({
        section: undefined,
        func: undefined,
        data: this.props.module.data[index],
      });
    }
  };

  private onSectionClick = (section: wasm.SectionHeader) => {
    go(['section', section.index]);
  };
  private onFuncClick = (func: Indexed<wasmCode.FunctionHeader>) => {
    go(['function', func.index]);
  };
  private onDataClick = (data: Indexed<wasm.DataSectionData>) => {
    go(['data', data.index]);
  };

  componentDidMount() {
    window.onhashchange = this.onHashChange;
    this.onHashChange();
  }
  render({ module }: AppProps) {
    const { section } = this.state;
    let extra: preact.ComponentChild;
    if (section) {
      switch (section.type) {
        case wasm.SectionType.type:
          extra = <TypeSection module={module} />;
          break;
        case wasm.SectionType.import:
          extra = <Imports module={module} />;
          break;
        case wasm.SectionType.function:
          extra = <FunctionSection module={module} />;
          break;
        case wasm.SectionType.export:
          extra = <Exports module={module} />;
          break;
        case wasm.SectionType.code:
          extra = (
            <Code
              key='code'
              onClick={this.onFuncClick}
              functionNames={module.functionNames}
            >
              {module.functions}
            </Code>
          );
          break;
        case wasm.SectionType.data:
          extra = (
            <DataSection
              module={module}
              data={module.data}
              onClick={this.onDataClick}
            />
          );
          break;
        case wasm.SectionType.global:
          extra = <Global module={module} />;
          break;
        case wasm.SectionType.custom:
          if (section.name === 'name') {
            extra = (
              <div>
                (gathered name data is displayed inline in other sections)
              </div>
            );
            break;
          }
        // fall through
        default:
          extra = (
            <div>
              TODO: no viewer implemented for '{section.type}' section yet
            </div>
          );
      }
    } else if (this.state.func) {
      extra = (
        <Function
          module={this.props.module}
          func={this.state.func}
          name={module.functionNames.get(this.state.func.index)}
        ></Function>
      );
    } else if (this.state.data) {
      extra = <DataHex module={this.props.module} data={this.state.data} />;
    }

    return (
      <main>
        <Sections sections={module.sections} onClick={this.onSectionClick} />
        {extra}
      </main>
    );
  }
}

async function main() {
  const wasmBytes = await (await fetch('t.wasm')).arrayBuffer();
  const wasmModule = wasm.read(new DataView(wasmBytes));
  const module: ParsedModule = {
    bytes: wasmBytes,
    sections: wasmModule.sections.map((sec, index) => ({ ...sec, index })),
    types: [],
    imports: [],
    exports: [],
    functions: [],
    data: [],
    globals: [],
    functionNames: new Map(),
    globalNames: new Map(),
  };
  (window as any)['module'] = module;

  let importedFunctionCount = 0;
  for (const section of module.sections) {
    switch (section.type) {
      case wasm.SectionType.type:
        module.types = wasm
          .readTypeSection(wasmModule.getReader(section))
          .map((t, i) => {
            return { ...t, index: i };
          });
        break;
      case wasm.SectionType.custom: {
        const reader = wasmModule.getReader(section);
        const custom = wasm.readCustomSection(reader);
        switch (custom.name) {
          case 'name':
            section.name = 'name';
            const names = wasm.readNameSection(reader);
            if (names.functionNames) {
              for (const [idx, name] of names.functionNames) {
                if (module.functionNames.has(idx)) {
                  continue;
                }
                module.functionNames.set(idx, name);
              }
            }
            if (names.globalNames) {
              module.globalNames = names.globalNames;
            }
            break;
          default:
            section.name = `custom: '${custom.name}'`;
            break;
        }
        break;
      }
      case wasm.SectionType.import:
        module.imports = wasm
          .readImportSection(wasmModule.getReader(section))
          .map((imp) => {
            switch (imp.desc.type) {
              case wasm.DescType.typeidx:
                module.functionNames.set(importedFunctionCount, imp.name);
                return { ...imp, index: importedFunctionCount++ };
              default:
                return { ...imp, index: 'todo' as any };
            }
          });
        break;
      case wasm.SectionType.function:
        module.functions = wasm
          .readFunctionSection(wasmModule.getReader(section))
          .map((typeidx, i) => {
            return {
              index: importedFunctionCount + i,
              typeidx,
              ofs: 0,
              len: 0,
            };
          });
        break;
      case wasm.SectionType.export:
        module.exports = wasm.readExportSection(wasmModule.getReader(section));
        for (const exp of module.exports) {
          if (exp.desc.type == wasm.DescType.funcidx) {
            module.functionNames.set(exp.desc.index, exp.name);
          }
        }
        break;
      case wasm.SectionType.code: {
        wasmCode.read(wasmModule.getReader(section)).forEach((func, i) => {
          module.functions[i].ofs = func.ofs;
          module.functions[i].len = func.len;
        });
        break;
      }
      case wasm.SectionType.data:
        module.data = wasm
          .readDataSection(wasmModule.getReader(section))
          .map((data, index) => ({ ...data, index }));
        break;
      case wasm.SectionType.global: {
        const offset = module.imports.filter(
          (imp) => imp.desc.type === wasm.DescType.global
        ).length;
        module.globals = wasm
          .readGlobalSection(wasmModule.getReader(section))
          .map((g, i) => ({ ...g, index: i + offset }));
        break;
      }
    }
  }
  preact.render(<App module={module}></App>, document.body);
}

main();

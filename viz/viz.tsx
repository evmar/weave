import * as wasm from 'wasm';
import * as wasmCode from 'wasm/code';
import * as preact from 'preact';
import { h, Fragment } from 'preact';
import * as hooks from 'preact/hooks';

import { Sections } from './sections';
import { DataSection, DataHex } from './data';
import { CodeSection, Function, Instructions } from './code';
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
  tables: Indexed<wasm.TableType>[];
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
function linkFromHash(hash: string): Link | null {
  hash = hash.substring(1);
  if (!hash) return null;
  const parts = hash.split('=');
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
    (sec) => sec.kind === wasm.SectionKind.global
  )!;

  return (
    <Link title={`global ${props.index}`} target={['section', sec.index]}>
      {props.module.globalNames.get(props.index) ?? `global ${props.index}`}
    </Link>
  );
}

export function Screen(props: {
  module: ParsedModule;
  title: string;
  children: preact.ComponentChildren;
}) {
  return (
    <>
      <header>
        <h1>
          <a href='#'>weave</a> &gt; {props.title}
        </h1>
      </header>
      <main>{props.children}</main>
    </>
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
    <Screen module={props.module} title='"type" section'>
      <p>One entry per distinct function type used in the module.</p>
      <Table columns={columns}>
        {props.module.types.map((t, i) => ({ ...t, index: i }))}
      </Table>
    </Screen>
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
      <form className='inline-edit' onSubmit={commit}>
        <input
          ref={input}
          size={1}
          type='text'
          className='inline-edit'
          onfocusout={commit}
          value={props.children}
        />
      </form>
    );
  } else {
    return (
      <span onClick={() => setEditing(true)}>
        {props.children} <button className='inline-edit'>{'\u270e'}</button>
      </span>
    );
  }
}

function GlobalSection(props: { module: ParsedModule }) {
  const [edited, setEdited] = hooks.useState(0);

  return (
    <Screen module={props.module} title='"globals" section'>
      <p>Global variables, accessible to both the host environment and Wasm.</p>
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
                <td className='break-all flex-container'>
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
    </Screen>
  );
}

function FunctionSection(props: {
  module: ParsedModule;
  onClick: (index: number) => void;
}) {
  const columns: Column<Indexed<Function>>[] = [
    { name: 'func', className: 'right', data: (row) => row.index },
    {
      name: 'type',
      data: (row) => (
        <code>{wasm.funcTypeToString(props.module.types[row.typeidx])}</code>
      ),
    },
  ];
  return (
    <Screen module={props.module} title='"function" section'>
      <p>Associates functions with their types.</p>
      <Table columns={columns} onClick={(row) => props.onClick(row.index)}>
        {props.module.functions}
      </Table>
    </Screen>
  );
}

function TableSection(props: { module: ParsedModule }) {
  const columns: Column<Indexed<wasm.TableType>>[] = [
    { name: 'index', className: 'right', data: (table) => table.index },
    { name: 'limits', data: (table) => wasm.limitsToString(table.limits) },
    { name: 'type', data: (table) => table.element },
  ];
  return (
    <Screen module={props.module} title='"table" section'>
      <p>
        Collections of opaque references. (Wasm 1.0 only allowed a single
        table.)
      </p>
      <Table columns={columns}>{props.module.tables}</Table>
    </Screen>
  );
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
    const link = linkFromHash(document.location.hash);
    if (!link) {
      this.setState({ section: undefined, func: undefined, data: undefined });
      return;
    }
    const [target, index] = link;
    if (target === 'section') {
      const section = this.props.module.sections.find(
        (sec) => sec.index === index
      );
      if (section) {
        this.setState({ section, func: undefined });
      }
    } else if (target === 'function') {
      const importedCount = this.props.module.imports.filter(
        (imp) => imp.desc.kind === wasm.DescKind.typeidx
      ).length;
      if (index < importedCount) {
        const section = this.props.module.sections.find(
          (sec) => sec.kind === wasm.SectionKind.import
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
  private onFuncClick = (index: number) => {
    go(['function', index]);
  };
  private onDataClick = (data: Indexed<wasm.DataSectionData>) => {
    go(['data', data.index]);
  };

  componentDidMount() {
    window.onhashchange = this.onHashChange;
    this.onHashChange();
  }
  render({ module }: AppProps) {
    if (this.state.section) {
      switch (this.state.section.kind) {
        case wasm.SectionKind.type:
          return <TypeSection module={module} />;
        case wasm.SectionKind.import:
          return <Imports module={module} />;
        case wasm.SectionKind.function:
          return <FunctionSection module={module} onClick={this.onFuncClick} />;
        case wasm.SectionKind.table:
          return <TableSection module={module} />;
        case wasm.SectionKind.global:
          return <GlobalSection module={module} />;
        case wasm.SectionKind.export:
          return <Exports module={module} />;
        case wasm.SectionKind.code:
          return (
            <CodeSection
              module={module}
              onClick={this.onFuncClick}
              functionNames={module.functionNames}
            >
              {module.functions}
            </CodeSection>
          );
        case wasm.SectionKind.data:
          return (
            <DataSection
              module={module}
              data={module.data}
              onClick={this.onDataClick}
            />
          );
        case wasm.SectionKind.custom:
          // Note: be sure to add key= here if we end up rendering multiple custom sections
          // using the same component.
          if (this.state.section.name === 'name') {
            return (
              <div>
                (gathered name data is displayed inline in other sections)
              </div>
            );
          }
        // fall through
        default:
          return (
            <div>
              TODO: no viewer implemented for '{this.state.section.kind}'
              section yet
            </div>
          );
      }
    } else if (this.state.func) {
      return (
        <Function
          key={this.state.func.index}
          module={this.props.module}
          func={this.state.func}
          name={module.functionNames.get(this.state.func.index)}
        ></Function>
      );
    } else if (this.state.data) {
      return (
        <DataHex
          key={this.state.data.index}
          module={this.props.module}
          data={this.state.data}
        />
      );
    } else {
      return (
        <Sections
          module={this.props.module}
          sections={module.sections}
          onClick={this.onSectionClick}
        />
      );
    }
  }
}

function load(wasmBytes: ArrayBuffer) {
  const sections = wasm.read(wasmBytes);
  const module: ParsedModule = {
    bytes: wasmBytes,
    sections: sections.map((sec, index) => ({ ...sec, index })),
    types: [],
    imports: [],
    tables: [],
    exports: [],
    functions: [],
    data: [],
    globals: [],
    functionNames: new Map(),
    globalNames: new Map(),
  };
  (window as any)['module'] = module;

  let importedFunctionCount = 0;
  let importedGlobalCount = 0;
  for (const section of module.sections) {
    switch (section.kind) {
      case wasm.SectionKind.custom: {
        const reader = wasm.getSectionReader(wasmBytes, section);
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
      case wasm.SectionKind.type:
        module.types = wasm
          .readTypeSection(wasm.getSectionReader(wasmBytes, section))
          .map((t, i) => {
            return { ...t, index: i };
          });
        break;
      case wasm.SectionKind.import:
        module.imports = wasm
          .readImportSection(wasm.getSectionReader(wasmBytes, section))
          .map((imp) => {
            switch (imp.desc.kind) {
              case wasm.DescKind.typeidx:
                module.functionNames.set(importedFunctionCount, imp.name);
                return { ...imp, index: importedFunctionCount++ };
              case wasm.DescKind.global:
                importedGlobalCount++;
              // TODO don't fall through
              default:
                return { ...imp, index: 'todo' as any };
            }
          });
        break;
      case wasm.SectionKind.function:
        module.functions = wasm
          .readFunctionSection(wasm.getSectionReader(wasmBytes, section))
          .map((typeidx, i) => {
            return {
              index: importedFunctionCount + i,
              typeidx,
              ofs: 0,
              len: 0,
            };
          });
        break;
      case wasm.SectionKind.table:
        module.tables = wasm
          .readTableSection(wasm.getSectionReader(wasmBytes, section))
          .map((table, i) => ({ ...table, index: i }));
        break;
      case wasm.SectionKind.global:
        module.globals = wasm
          .readGlobalSection(wasm.getSectionReader(wasmBytes, section))
          .map((global, i) => ({ ...global, index: importedGlobalCount + i }));
        break;
      case wasm.SectionKind.export:
        module.exports = wasm.readExportSection(
          wasm.getSectionReader(wasmBytes, section)
        );
        for (const exp of module.exports) {
          if (exp.desc.kind == wasm.DescKind.funcidx) {
            module.functionNames.set(exp.desc.index, exp.name);
          }
        }
        break;
      case wasm.SectionKind.code:
        wasmCode
          .read(wasm.getSectionReader(wasmBytes, section))
          .forEach((func, i) => {
            module.functions[i].ofs = func.ofs;
            module.functions[i].len = func.len;
          });
        break;
      case wasm.SectionKind.data:
        module.data = wasm
          .readDataSection(wasm.getSectionReader(wasmBytes, section))
          .map((data, index) => ({ ...data, index }));
        break;
    }
  }
  preact.render(<App module={module}></App>, document.body);
}

/**
 * Allow drag'n'drop of a wasm file to load it.
 * This function took me an hour of fiddling with the DOM API to figure out.
 * The two key tricks are preventDefault on dragover and checking relatedTarget
 * on dragleave.
 */
function addDragHandlers() {
  window.ondragenter = (ev) => {
    document.body.style.opacity = '0.5';
    ev.preventDefault();
  };
  window.ondragleave = (ev) => {
    if (ev.relatedTarget) {
      // https://stackoverflow.com/questions/3144881/how-do-i-detect-a-html5-drag-event-entering-and-leaving-the-window-like-gmail-d
      return;
    }
    document.body.style.opacity = '';
    ev.preventDefault();
  };
  window.ondragover = (ev) => {
    ev.preventDefault();
  };
  window.ondrop = async (ev) => {
    document.body.style.opacity = '';
    if (ev.dataTransfer?.items.length !== 1) return;
    const file = ev.dataTransfer.items[0].getAsFile();
    if (!file) return;
    ev.preventDefault();
    load(await file.arrayBuffer());
  };
}

async function main() {
  const name = 't.wasm';
  const wasmBytes = await (await fetch('t.wasm')).arrayBuffer();
  load(wasmBytes);
  addDragHandlers();
}

main();

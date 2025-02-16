/**
 * Main entry point.
 */

import * as preact from 'preact';
import { Fragment, h } from 'preact';
import * as hooks from 'preact/hooks';
import * as wasm from 'wasm';

import { CodeSection, FunctionView, Instructions } from './code';
import { DataHex, DataSection, HexView } from './data';
import { Exports, Imports } from './impexp';
import { Sections } from './sections';
import { Column, Table } from './table';
import { FunctionType, FunctionSpan, Indexed, loadModule, ParsedModule } from './module';

export type Link = [target: 'section' | 'function' | 'data', index: number];
function urlFromLink([target, index]: Link): string {
  let url = `#${target}=${index}`;
  return url;
}
function linkFromHash(hash: string): Link | null {
  hash = hash.substring(1);
  if (!hash) return null;
  const parts = hash.split('=');
  const target = parts[0];
  if (target !== 'section' && target !== 'function' && target !== 'data') {
    return null;
  }
  return [target, parseInt(parts[1])];
}
function go(link: Link) {
  window.location.hash = urlFromLink(link);
}
export function Link(props: {
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

export function Screen(props: {
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

function NamesSection(props: { module: ParsedModule }) {
  const sec = props.module.names!;
  return (
    <Screen title='"name" section'>
      <p>
        Names for objects found in the file, typically for debugging purposes.
      </p>
      <table>
        <tr>
          <th className='right'>module name</th>
          <td>{sec.moduleName ?? <i>none</i>}</td>
        </tr>
        <tr>
          <th className='right'>local names</th>
          <td>{sec.localNames?.size ?? <i>none</i>}</td>
        </tr>
        <tr>
          <th className='right'>function names</th>
          <td>{sec.functionNames?.size ?? <i>none</i>}</td>
        </tr>
        <tr>
          <th className='right'>global names</th>
          <td>{sec.globalNames?.size ?? <i>none</i>}</td>
        </tr>
        <tr>
          <th className='right'>data names</th>
          <td>{sec.dataNames?.size ?? <i>none</i>}</td>
        </tr>
      </table>
    </Screen>
  );
}

function ProducersSection(props: { module: ParsedModule }) {
  return (
    <Screen title='"producers" section'>
      <p>
        <a href='https://github.com/WebAssembly/tool-conventions/blob/main/ProducersSection.md'>
          Tools used
        </a>{' '}
        to produce the module.
      </p>
      <table>
        {props.module.producers!.map((field) => (
          <tr>
            <td>{field.name}</td>
            <td>
              {field.values.map(({ name, version }) => (
                <div>
                  {name} {version}
                </div>
              ))}
            </td>
          </tr>
        ))}
      </table>
    </Screen>
  );
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
    <Screen title='"type" section'>
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

function MemorySection(props: { module: ParsedModule }) {
  const columns: Column<Indexed<wasm.Limits>>[] = [
    { name: 'index', className: 'right', data: (limits) => limits.index },
    { name: 'limits', data: (limits) => wasm.limitsToString(limits) },
  ];
  return (
    <Screen title='"memory" section'>
      <p>Definition of memory. Currently limited to one entry.</p>
      <Table columns={columns}>{props.module.memories}</Table>
    </Screen>
  );
}

function GlobalSection(props: { module: ParsedModule }) {
  const [edited, setEdited] = hooks.useState(0);

  return (
    <Screen title='"globals" section'>
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
  const columns: Column<Indexed<FunctionSpan>>[] = [
    { name: 'func', className: 'right', data: (row) => row.index },
    {
      name: 'type',
      data: (row) => <code>{wasm.funcTypeToString(props.module.types[row.typeidx])}</code>,
    },
  ];
  return (
    <Screen title='"function" section'>
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
    <Screen title='"table" section'>
      <p>
        Collections of opaque references. (Wasm 1.0 only allowed a single table.)
      </p>
      <Table columns={columns}>{props.module.tables}</Table>
    </Screen>
  );
}

function ElementSection(props: { module: ParsedModule }) {
  const columns: Column<Indexed<wasm.Element>>[] = [
    { name: 'index', className: 'right', data: (elem) => elem.index },
    { name: 'type', data: (elem) => elem.type },
    {
      name: 'init',
      data: (elem) => `${elem.init.length} entries`,
    },
    {
      name: 'mode',
      data: (elem) => {
        if (elem.mode === wasm.ElementMode.active) {
          return (
            <div>
              active table={elem.table}
              <br />
              offset:
              <Instructions module={props.module} instrs={elem.offset} />
            </div>
          );
        } else {
          return elem.mode;
        }
      },
    },
  ];
  return (
    <Screen title='"element" section'>
      <p>Initializers for tables.</p>
      <Table columns={columns}>{props.module.elements}</Table>
    </Screen>
  );
}

namespace Weave {
  export interface Props {
    module: ParsedModule;
  }
  export interface State {
    section?: wasm.SectionHeader & { name?: string };
    func?: Indexed<FunctionSpan>;
    data?: Indexed<wasm.DataSectionData>;
  }
}
class Weave extends preact.Component<Weave.Props, Weave.State> {
  state: Weave.State = {};

  private onHashChange = () => {
    const link = linkFromHash(document.location.hash);
    if (!link) {
      this.setState({ section: undefined, func: undefined, data: undefined });
      return;
    }
    const [target, index] = link;
    if (target === 'section') {
      const section = this.props.module.sections.find(
        (sec) => sec.index === index,
      );
      if (section) {
        this.setState({ section, func: undefined });
      }
    } else if (target === 'function') {
      const importedCount = this.props.module.imports.filter(
        (imp) => imp.desc.kind === wasm.DescKind.typeidx,
      ).length;
      if (index < importedCount) {
        const section = this.props.module.sections.find(
          (sec) => sec.kind === wasm.SectionKind.import,
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
  render() {
    const { module } = this.props;
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
        case wasm.SectionKind.memory:
          return <MemorySection module={module} />;
        case wasm.SectionKind.export:
          return <Exports module={module} />;
        case wasm.SectionKind.element:
          return <ElementSection module={module} />;
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
            return <NamesSection module={module} />;
          } else if (this.state.section.name === 'producers') {
            return <ProducersSection module={module} />;
          } else {
            return (
              <Screen title='custom section'>
                <p>
                  No view yet for <code>{this.state.section.name}</code>. Showing raw dump.
                </p>
                <HexView
                  data={module.customSectionData.get(this.state.section.index)!}
                />
              </Screen>
            );
          }
        // fall through
        default:
          return (
            <div>
              TODO: no viewer implemented for '{this.state.section.kind}' section yet
            </div>
          );
      }
    } else if (this.state.func) {
      return (
        <FunctionView
          key={this.state.func.index}
          module={this.props.module}
          func={this.state.func}
          name={module.functionNames.get(this.state.func.index)}
        />
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

namespace App {
  export interface State {
    module?: ParsedModule;
  }
}
class App extends preact.Component<{}, App.State> {
  private load(buffer: ArrayBuffer) {
    const module = loadModule(buffer);
    this.setState({ module });
  }

  /**
   * Allow drag'n'drop of a wasm file to load it.
   * This function took me an hour of fiddling with the DOM API to figure out.
   * The two key tricks are preventDefault on dragover and checking relatedTarget
   * on dragleave.
   */
  private addDragHandlers() {
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
      this.load(await file.arrayBuffer());
    };
  }

  async componentDidMount() {
    this.addDragHandlers();
    if (document.location.search) {
      const name = document.location.search.substring(1);
      const wasmBytes = await (await fetch(name)).arrayBuffer();
      this.load(wasmBytes);
    }
  }

  render() {
    if (this.state.module) {
      return <Weave module={this.state.module} />;
    }
    return (
      <>
        <header>
          <h1>weave</h1>
        </header>
        <main>
          <p>
            Weave is a viewer for WebAssembly <code>.wasm</code> files, like an interactive <code>objdump</code>.
          </p>
          <p>
            Load a file by drag'n'drop'ing a <code>.wasm</code> file onto this page.
          </p>
        </main>
      </>
    );
  }
}

function main() {
  preact.render(<App />, document.body);
}

main();

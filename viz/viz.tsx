/**
 * Main entry point.
 */

import * as preact from 'preact';
import { Fragment, h } from 'preact';
import * as hooks from 'preact/hooks';
import * as wasm from 'wasm';

import { FunctionSpan, Indexed, loadModule, ParsedModule } from './module';
import { Sections } from './sections';
import { CodeSection, FunctionView } from './section-code';
import { DataHex, DataSection, HexView } from './section-data';
import { ElementSection } from './section-element';
import { FunctionSection } from './section-function';
import { GlobalSection } from './section-globals';
import { Exports, Imports } from './section-impexp';
import { MemorySection } from './section-memory';
import { NamesSection } from './section-names';
import { ProducersSection } from './section-producers';
import { TableSection } from './section-table';
import { TypeSection } from './section-types';

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

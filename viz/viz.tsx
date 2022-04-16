import * as wasm from 'wasm';
import * as wasmCode from 'wasm/code';
import * as preact from 'preact';
import { h, Fragment } from 'preact';

import { Sections } from './sections';
import { DataSection } from './data';
import { Code, Function, Instructions } from './code';
import { Column, Table } from './table';

export type Indexed<T> = T & { index: number };
export interface ParsedModule {
  sections: (wasm.SectionHeader & { name?: string })[];

  types: wasm.FuncType[];
  imports: Indexed<wasm.Import>[];
  exports: wasm.Export[];
  code: Indexed<wasmCode.Function>[];
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
function Link(props: { target: Link; children: preact.ComponentChildren }) {
  return <a href={urlFromLink(props.target)}>{props.children}</a>;
}

export function FunctionRef(props: { module: ParsedModule; index: number }) {
  return (
    <Link target={['function', props.index]}>
      {props.module.functionNames.get(props.index) ?? `function ${props.index}`}
    </Link>
  );
}

function FunctionType(props: { type: wasm.FuncType }) {
  return <code>{wasm.funcTypeToString(props.type)}</code>;
}

function TypeSection(props: { module: ParsedModule }) {
  const columns: Column<wasm.FuncType>[] = [
    {name: 'index', className: 'right', data: (_, index) => index },
    {name: 'type', cellClass: 'break-all', data: (type) =>  <FunctionType type={type} /> },

  ];
  return <Table columns={columns}>{props.module.types}</Table>;
}

function ImpExpDesc(props: {
  module: ParsedModule;
  desc: wasm.Import['desc'] | wasm.Export['desc'];
}) {
  switch (props.desc.type) {
    case wasm.DescType.typeidx:
      return <FunctionType type={props.module.types[props.desc.index]} />;
    default:
      return <>{wasm.descToString(props.desc)}</>;
  }
}

function Imports(props: { module: ParsedModule }) {
  const imports = props.module.imports;
  return (
    <table>
      <thead>
        <tr>
          <th className='right'>index</th>
          <th>name</th>
          <th>desc</th>
        </tr>
      </thead>
      <tbody>
        {imports.map((imp) => (
          <tr>
            <td className='right'>{imp.index}</td>
            <td className='break-all'>
              <code>
                {imp.module}.{imp.name}
              </code>
            </td>
            <td className='nowrap'>
              <ImpExpDesc module={props.module} desc={imp.desc} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Exports(props: { children: wasm.Export[] }) {
  const exports = props.children;
  return (
    <table>
      <thead>
        <tr>
          <th>name</th>
          <th>desc</th>
        </tr>
      </thead>
      <tbody>
        {exports.slice(0, 100).map((exp) => (
          <tr>
            <td className='break-all'>
              <code>{exp.name}</code>
            </td>
            <td className='nowrap'>{wasm.descToString(exp.desc)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Global(props: { module: ParsedModule }) {
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
                <code>{props.module.globalNames.get(global.index)}</code>
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

interface AppProps {
  module: ParsedModule;
}
interface AppState {
  section?: wasm.SectionHeader & { name?: string };
  func?: Indexed<wasmCode.Function>;
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
          this.setState({ section, func: undefined });
        }
      } else {
        const func = this.props.module.code[index - importedCount];
        if (func) {
          this.setState({ section: undefined, func });
        }
      }
    }
  };

  private onSectionClick = (section: wasm.SectionHeader) => {
    go(['section', section.index]);
  };
  private onFuncClick = (func: Indexed<wasmCode.Function>) => {
    go(['function', func.index]);
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
        case wasm.SectionType.export:
          extra = <Exports>{module.exports}</Exports>;
          break;
        case wasm.SectionType.code:
          extra = (
            <Code
              onClick={this.onFuncClick}
              functionNames={module.functionNames}
            >
              {module.code}
            </Code>
          );
          break;
        case wasm.SectionType.data:
          extra = <DataSection module={module} data={module.data} />;
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
    sections: wasmModule.sections.map((sec, index) => ({ ...sec, index })),
    types: [],
    imports: [],
    exports: [],
    code: [],
    data: [],
    globals: [],
    functionNames: new Map(),
    globalNames: new Map(),
  };
  (window as any)['module'] = module;
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
        let funcIndex = 0;
        module.imports = wasm
          .readImportSection(wasmModule.getReader(section))
          .map((imp) => {
            switch (imp.desc.type) {
              case wasm.DescType.typeidx:
                module.functionNames.set(funcIndex, imp.name);
                return { ...imp, index: funcIndex++ };
              default:
                return { ...imp, index: 'todo' as any };
            }
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
        const offset = module.imports.filter(
          (imp) => imp.desc.type === wasm.DescType.typeidx
        ).length;
        module.code = wasmCode
          .read(wasmModule.getReader(section))
          .map((f, i) => ({ ...f, index: i + offset }));
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

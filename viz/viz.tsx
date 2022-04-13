import * as wasm from 'wasm';
import * as wasmCode from 'wasm/code';
import * as preact from 'preact';
import { h, Fragment } from 'preact';
import * as d3 from 'd3';

import { Sections } from './sections';

type Indexed<T> = T & { index: number };
interface ParsedModule {
  sections: (wasm.SectionHeader & { name?: string })[];

  imports: Indexed<wasm.Import>[];
  exports: wasm.Export[];
  code: Indexed<wasmCode.Function>[];
  names?: wasm.NameSection;
  data: wasm.DataSectionData[];
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

function Imports(props: { children: Indexed<wasm.Import>[] }) {
  const imports = props.children;
  return (
    <table>
      <thead>
        <tr>
          <th className="right">index</th>
          <th>name</th>
          <th>desc</th>
        </tr>
      </thead>
      <tbody>
        {imports.map((imp) => (
          <tr>
            <td className="right">{imp.index}</td>
            <td className="break-all">
              <code>
                {imp.module}.{imp.name}
              </code>
            </td>
            <td className="nowrap">{wasm.descToString(imp.desc)}</td>
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
            <td className="break-all">
              <code>{exp.name}</code>
            </td>
            <td className="nowrap">{wasm.descToString(exp.desc)}</td>
          </tr>
        ))}
      </tbody>
    </table>
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
class Code extends preact.Component<CodeProps, CodeState> {
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

namespace Instructions {
  export interface Props {
    module: ParsedModule;
    instrs: wasmCode.Instruction[];
  }
  export interface State {
    expanded: boolean;
  }
}
class Instructions extends preact.Component<
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

  private renderFunc(index: number) {
    return (
      <Link target={['function', index]}>
        {this.props.module.functionNames.get(index) ?? `function ${index}`}
      </Link>
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
            {instr.op} {this.renderFunc(instr.func)}
            {'\n'}
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

function Function(props: {
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

function Data(props: { module: ParsedModule; data: wasm.DataSectionData[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>size</th>
          <th>init</th>
        </tr>
      </thead>
      <tbody>
        {props.data.map((data) => {
          return (
            <tr>
              <td>{data.init.byteLength}</td>
              <td>
                {data.memidx === undefined ? (
                  'passive'
                ) : (
                  <Instructions module={props.module} instrs={data.offset!} />
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Global(props: { module: ParsedModule }) {
  return (
    <table>
      <thead>
        <tr>
          <th className="right">index</th>
          <th>name</th>
          <th>type</th>
          <th>init</th>
        </tr>
      </thead>
      <tbody>
        {props.module.globals.map((global) => {
          return (
            <tr>
              <td className="right">{global.index}</td>
              <td className="break-all">
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
  section?: wasm.SectionHeader;
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
      if (index <= importedCount) {
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
    let extra: preact.ComponentChild;
    if (this.state.section) {
      switch (this.state.section.type) {
        case wasm.SectionType.import:
          extra = <Imports>{module.imports}</Imports>;
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
          extra = <Data module={module} data={module.data} />;
          break;
        case wasm.SectionType.global:
          extra = <Global module={module} />;
          break;
        default:
          extra = <div>TODO: no viewer implemented for this section</div>;
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
          .map((imp, i) => ({ ...imp, index: i }));
        let funcIndex = 0;
        for (const imp of module.imports) {
          if (imp.desc.type == wasm.DescType.typeidx) {
            module.functionNames.set(funcIndex++, imp.name);
          }
        }
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
        module.data = wasm.readDataSection(wasmModule.getReader(section));
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

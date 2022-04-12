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
  functionNames: Map<number, string>;
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
            <td className="nowrap">{wasm.indexToString(imp.desc)}</td>
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
            <td className="nowrap">{wasm.indexToString(exp.desc)}</td>
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
              <td>
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

function renderFunctionBody(module: ParsedModule, func: wasmCode.Function) {
  return <pre>{Array.from(renderInstrs(func.body))}</pre>;

  function renderFunc(index: number) {
    return (
      <Link target={['function', index]}>
        {module.functionNames.get(index) ?? `function ${index}`}
      </Link>
    );
  }

  function* renderInstr(
    instr: wasmCode.Instruction,
    indent = 0
  ): Generator<preact.ComponentChild> {
    switch (instr.op) {
      case wasmCode.Instr.call:
        yield (
          <div>
            {instr.op} {renderFunc(instr.func)}
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
          </div>
        );
    }

    if (
      instr.op === wasmCode.Instr.if ||
      instr.op === wasmCode.Instr.block ||
      instr.op === wasmCode.Instr.loop
    ) {
      yield* renderInstrs(instr.body, indent + 1);
      if (instr.op === wasmCode.Instr.if && instr.else) {
        yield (
          <div>
            {'  '.repeat(indent)}
            {'else'}
          </div>
        );
        yield* renderInstrs(instr.else, indent + 1);
      }
    }
  }
  function* renderInstrs(instrs: wasmCode.Instruction[], indent = 0) {
    for (const instr of instrs) {
      yield* renderInstr(instr, indent);
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
      {renderFunctionBody(props.module, props.func)}
    </>
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
      if (index <= this.props.module.imports.length) {
        const section = this.props.module.sections.find(
          (sec) => sec.type === wasm.SectionType.import
        );
        if (section) {
          this.setState({ section, func: undefined });
        }
      } else {
        const func =
          this.props.module.code[index - this.props.module.imports.length];
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
    let extra;
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
    functionNames: new Map(),
  };
  (window as any)['module'] = module;
  for (const section of module.sections) {
    switch (section.type) {
      case wasm.SectionType.custom:
        const custom = wasm.readCustomSection(wasmModule.getReader(section));
        section.name = `custom: '${custom.name}'`;
        break;
      case wasm.SectionType.import:
        module.imports = wasm
          .readImportSection(wasmModule.getReader(section))
          .map((imp, i) => ({ ...imp, index: i }));
        let funcIndex = 0;
        for (const imp of module.imports) {
          if (imp.desc.type == wasm.IndexType.type) {
            module.functionNames.set(funcIndex++, imp.name);
          }
        }
        break;
      case wasm.SectionType.export:
        module.exports = wasm.readExportSection(wasmModule.getReader(section));
        for (const exp of module.exports) {
          if (exp.desc.type == wasm.IndexType.func) {
            module.functionNames.set(exp.desc.index, exp.name);
          }
        }
        break;
      case wasm.SectionType.code:
        module.code = wasmCode
          .read(wasmModule.getReader(section))
          .map((f, i) => ({ ...f, index: i + module.imports.length }));
        break;
    }
  }
  preact.render(<App module={module}></App>, document.body);
}

main().catch((err) => {
  console.error(err);
});

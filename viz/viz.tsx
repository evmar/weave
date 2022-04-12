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

interface FuncsProps {
  children: Indexed<wasmCode.Function>[];
  onClick: (func: Indexed<wasmCode.Function>) => void;
}
interface FuncsState {
  totalSize: number;
  funcs: Indexed<wasmCode.Function>[];
}
class Funcs extends preact.Component<FuncsProps, FuncsState> {
  state = { totalSize: 0, funcs: [] };
  static getDerivedStateFromProps(props: FuncsProps): object {
    const totalSize = d3.sum(props.children.map((f) => f.size));
    const funcs = d3
      .sort(props.children, (f1, f2) => d3.descending(f1.size, f2.size))
      .slice(0, 100);
    return { totalSize, funcs };
  }
  render(props: FuncsProps, state: FuncsState) {
    return (
      <table>
        <thead>
          <tr>
            <th className="right">index</th>
            <th className="right">size</th>
            <th className="right">%</th>
          </tr>
        </thead>
        <tbody>
          {state.funcs.map((f) => (
            <tr className="pointer" onClick={() => props.onClick(f)}>
              <td className="right">{f.index}</td>
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

function* renderInstr(instr: wasmCode.Instruction, indent = 0): Generator<preact.ComponentChild> {
  switch (instr.op) {
  // TODO: custom rendering here.
  default:
    const toPrint = [instr.op.toString()];
    for (const [key, val] of Object.entries(instr)) {
      if (key === 'op') continue;
      if (val instanceof Array) continue;
      toPrint.push(` ${key}=${val}`);
    }
    yield <div>{'  '.repeat(indent)}{toPrint.join('')}</div>;
  }

  if (
    instr.op === wasmCode.Instr.if ||
    instr.op === wasmCode.Instr.block ||
    instr.op === wasmCode.Instr.loop
  ) {
    yield* renderInstrs(instr.body, indent + 1);
    if (instr.op === wasmCode.Instr.if && instr.else) {
      yield <div>{'  '.repeat(indent)}{'else'}</div>;
      yield* renderInstrs(instr.else, indent + 1);
    }
  }
}
function* renderInstrs(instrs: wasmCode.Instruction[], indent = 0) {
  for (const instr of instrs) {
    yield* renderInstr(instr, indent);
  }
}

function Code({ func }: { func: Indexed<wasmCode.Function> }) {
  return (
    <>
      <b>
        function {func.index} {func.size}:
      </b>
      <pre>
      {Array.from(renderInstrs(func.body))}
      </pre>
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

  private onSectionClick = (section: wasm.SectionHeader) => {
    this.setState({ section, func: undefined });
  };
  private onFuncClick = (func: Indexed<wasmCode.Function>) => {
    this.setState({ section: undefined, func });
  };

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
          extra = <Funcs onClick={this.onFuncClick}>{module.code}</Funcs>;
          break;
      }
    } else if (this.state.func) {
      extra = <Code func={this.state.func}></Code>;
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
  };
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
        break;
      case wasm.SectionType.export:
        module.exports = wasm.readExportSection(wasmModule.getReader(section));
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

import * as d3 from 'd3';
import * as wasm from 'wasm';
import * as wasmCode from 'wasm/code';
import * as preact from 'preact';
import { h, Fragment } from 'preact';

type Indexed<T> = T & { index: number };
interface ParsedModule {
  sections: (wasm.SectionHeader & { name?: string })[];
  imports: Indexed<wasm.Import>[];
  exports: wasm.Export[];
  code: Indexed<wasmCode.Function>[];
}

interface SectionsPartProps {
  sections: (wasm.SectionHeader & { name?: string })[];
  onClick: (sec: wasm.SectionHeader) => void;
  onHover: (sec: wasm.SectionHeader|undefined) => void;
  hovered?: wasm.SectionHeader;
}
function Pie(props: SectionsPartProps) {
  const width = 200;
  const height = 200;
  const colors = d3.schemeSpectral[props.sections.length];
  const color = d3.scaleOrdinal(props.sections, colors);

  const arcs = d3
    .pie<wasm.SectionHeader>()
    .padAngle(0.01)
    .value((s) => s.len)(props.sections);
  const arc = d3
    .arc<d3.PieArcDatum<wasm.SectionHeader>>()
    .innerRadius((width / 2) * 0.6)
    .outerRadius((width / 2) * 0.95);

  return (
    <svg
      width={width}
      height={height}
      viewBox={[-width / 2, -height / 2, width, height].join(' ')}
    >
      <g
        strokeLinejoin="round"
        strokeWidth="2"
        ref={(g) =>
          d3
            .select(g)
            .selectAll('path')
            .data(arcs)
            .join('path')
            .attr('fill', (d) => color(d.data))
            .attr('stroke', (d) =>
              d.data === props.hovered ? 'black' : 'none'
            )
            .attr('d', arc)
            .on('mouseover', (ev, d) => props.onHover(d.data))
            .on('mouseout', (ev, d) => props.onHover(undefined))
            .on('click', (e, d) => props.onClick(d.data))
        }
      ></g>
    </svg>
  );
}

function SectionTable(props: SectionsPartProps) {
  const totalSize = d3.sum(props.sections.map((sec) => sec.len));
  return (
    <table style="flex:1" cellSpacing="0" cellPadding="0">
      <thead>
        <tr>
          <th>section</th>
          <th className="right">size</th>
          <th className="right">%</th>
        </tr>
      </thead>
      <tbody id="table">
        {props.sections.map((sec) => (
          <tr
            className={'pointer ' + (sec === props.hovered ? 'hover' : '')}
            onMouseEnter={() => props.onHover(sec)}
            onMouseLeave={() => props.onHover(undefined)}
            onClick={() => props.onClick(sec)}
          >
            <td>{sec.name ?? sec.type}</td>
            <td className="right">{d3.format(',')(sec.len)}</td>
            <td className="right">{d3.format('.1%')(sec.len / totalSize)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface SectionsProps {
  sections: (wasm.SectionHeader & { name?: string })[];
  onClick: (sec: wasm.SectionHeader) => void;
}
interface SectionsState {
  hovered?: wasm.SectionHeader;
}
class Sections extends preact.Component<SectionsProps, SectionsState> {
  private onSectionHover = (section: wasm.SectionHeader | undefined) => {
    this.setState({ hovered: section });
  };
  render(props: SectionsProps, state: SectionsState) {
    return (
      <div style="display: flex">
        <Pie {...props} {...state} onHover={this.onSectionHover} />
        <SectionTable {...props} {...state}  onHover={this.onSectionHover}/>
      </div>
    );
  }
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
  onClick: (func: wasmCode.Function) => void;
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
      //<Code func={funcs[0]} />
    );
  }
}

function Code({ func }: { func: Indexed<wasmCode.Function> }) {
  return (
    <pre>
      <b>function {func.index}:</b>
      {func.body.map((instr) => (
        <div>{instr.op}</div>
      ))}
    </pre>
  );
}

interface AppProps {
  module: ParsedModule;
}
interface AppState {
  hovered?: wasm.SectionHeader;
  section?: wasm.SectionHeader;
  func?: wasmCode.Function;
}
class App extends preact.Component<AppProps, AppState> {
  state: AppState = {};

  private onSectionClick = (section: wasm.SectionHeader) => {
    this.setState({ section, func: undefined });
  };
  private onFuncClick = (func: wasmCode.Function) => {
    this.setState({ section: undefined, func });
  };

  render({ module }: AppProps) {
    let extra;
    switch (this.state.section?.type) {
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

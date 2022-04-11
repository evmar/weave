import * as d3 from 'd3';
import * as wasm from 'wasm';
import * as wasmCode from 'wasm/code';
import * as preact from 'preact';
import { h, Fragment } from 'preact';

type Indexed<T> = T & { index: number };
interface ParsedModule {
  sections: Indexed<wasm.SectionHeader>[];
  imports: Indexed<wasm.Import>[];
  exports: wasm.Export[];
  code: Indexed<wasmCode.Function>[];
}

interface PieProps {
  sections: Indexed<wasm.SectionHeader>[];
  hovered: number | undefined;
  onHover: (index: number | undefined) => void;
}
function Pie({ sections, hovered, onHover }: PieProps) {
  const width = 200;
  const height = 200;
  const colors = d3.schemeSpectral[sections.length];

  const arcs = d3
    .pie<Indexed<wasm.SectionHeader>>()
    .padAngle(0.01)
    .value((s) => s.len)(sections);
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
            .attr('fill', (d) => colors[d.data.index])
            .attr('stroke', (d) =>
              d.data.index === hovered ? 'black' : 'none'
            )
            .attr('d', arc)
            .on('mouseover', (ev, d) => onHover(d.data.index))
            .on('mouseout', (ev, d) => onHover(undefined))
        }
      ></g>
    </svg>
  );
}

interface TableProps {
  sections: Indexed<wasm.SectionHeader>[];
  hovered: number | undefined;
  onHover: (index: number | undefined) => void;
}
function Table({ sections, hovered, onHover }: TableProps) {
  const totalSize = d3.sum(sections.map((sec) => sec.len));
  return (
    <table style="flex:1" cellSpacing="0" cellPadding="0">
      <thead>
        <tr>
          <th>section</th>
          {/* @ts-ignore */}
          <th align="right">size</th>
          {/* @ts-ignore */}
          <th align="right">%</th>
        </tr>
      </thead>
      <tbody id="table">
        {sections.map((sec) => (
          <tr
            className={sec.index === hovered ? 'hover' : ''}
            onMouseEnter={() => onHover(sec.index)}
            onMouseLeave={() => onHover(undefined)}
          >
            <td>{sec.type}</td>
            {/* @ts-ignore */}
            <td align="right">{d3.format(',')(sec.len)}</td>
            {/* @ts-ignore */}
            <td align="right">{d3.format('.1%')(sec.len / totalSize)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Imports(props: { children: Indexed<wasm.Import>[] }) {
  const imports = props.children;
  return (
    <pre>
      <b>imports</b>{'\n'}
      {imports.map((imp) => `${imp.index}: ${wasm.importToString(imp)}\n`)}
    </pre>
  );
}

function Exports(props: { children: wasm.Export[] }) {
  const exports = props.children;
  return (
    <pre>
      <b>exports</b>
      {exports.map((exp) => wasm.exportToString(exp) + '\n')}
    </pre>
  );
}

interface FuncsProps {
  children: Indexed<wasmCode.Function>[];
}
interface FuncsState {
  funcs: Indexed<wasmCode.Function>[];
}
class Funcs extends preact.Component<FuncsProps, FuncsState> {
  state = { funcs: [] };
  static getDerivedStateFromProps(props: FuncsProps): object {
    const funcs = d3
      .sort(props.children, (f1, f2) =>
        d3.descending(f1.body.length, f2.body.length)
      )
      .slice(0, 10);
    return { funcs };
  }
  render(_: FuncsProps, { funcs }: FuncsState) {
    return (
      <>
        <b>code</b>{'\n'}
        <table>
          <thead><tr><th>index</th><th>size</th><th>%</th></tr></thead>
          <tbody>
          {funcs.map((f) => (
          <tr><td>{f.index}</td><td>{f.body.length}</td><td></td></tr>
        ))}
          </tbody>

        </table>
        <Code func={funcs[0]} />
      </>
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
  hovered: number | undefined;
}
class App extends preact.Component<AppProps, AppState> {
  state: AppState = { hovered: undefined };
  private onHover = (sec: number | undefined) => {
    if (sec === this.state.hovered) return;
    this.setState({ hovered: sec });
  };

  render({ module }: AppProps) {
    return (
      <main>
        <div style="display: flex">
          <Pie
            sections={module.sections}
            hovered={this.state.hovered}
            onHover={this.onHover}
          ></Pie>
          <Table
            sections={module.sections}
            hovered={this.state.hovered}
            onHover={this.onHover}
          ></Table>
        </div>
        <Exports>{module.exports}</Exports>
        <Imports>{module.imports}</Imports>
        <Funcs>{module.code}</Funcs>
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

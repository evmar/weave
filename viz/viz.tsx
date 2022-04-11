import * as d3 from 'd3';
import * as wasm from 'wasm';
import * as code from 'wasm/code';
import * as preact from 'preact';
import { h, Fragment } from 'preact';

type IndexedSection = wasm.SectionHeader & { index: number };

interface PieProps {
  sections: IndexedSection[];
  hovered: number | undefined;
  onHover: (index: number | undefined) => void;
}
function Pie({ sections, hovered, onHover }: PieProps) {
  const width = 200;
  const height = 200;
  const colors = d3.schemeSpectral[sections.length];

  const arcs = d3
    .pie<IndexedSection>()
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
  sections: IndexedSection[];
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
          <th align="right">size</th>
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
            <td align="right">{d3.format(',')(sec.len)}</td>
            <td align="right">{d3.format('.1%')(sec.len / totalSize)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type IndexedFunction = code.Function & { index: number };
interface FuncsProps {
  children: IndexedFunction[];
}
interface FuncsState {
  funcs: IndexedFunction[];
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
        {funcs.map((f) => (
          <div>{f.index}</div>
        ))}
        <Code func={funcs[0]} />
      </>
    );
  }
}

function Code({ func }: { func: IndexedFunction }) {
  return (
    <pre>
      {func.body.map((instr) => (
        <div>{instr.op}</div>
      ))}
    </pre>
  );
}

interface AppProps {
  sections: IndexedSection[];
  funcs: IndexedFunction[];
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

  render({ sections, funcs }: AppProps) {
    return (
      <main>
        <div style="display: flex">
          <Pie
            sections={sections}
            hovered={this.state.hovered}
            onHover={this.onHover}
          ></Pie>
          <Table
            sections={sections}
            hovered={this.state.hovered}
            onHover={this.onHover}
          ></Table>
        </div>
        <Funcs>{funcs}</Funcs>
      </main>
    );
  }
}

async function main() {
  const wasmBytes = await (await fetch('t.wasm')).arrayBuffer();
  const module = wasm.read(new DataView(wasmBytes));
  const sections = module.sections.map((sec, index) => ({ ...sec, index }));
  const codeSection = module.sections.find(
    (sec) => sec.type === wasm.SectionType.code
  );
  let funcs: IndexedFunction[] = [];
  if (codeSection) {
    funcs = code
      .read(module.getReader(codeSection))
      .map((f, i) => ({ ...f, index: i }));
  }
  preact.render(<App sections={sections} funcs={funcs}></App>, document.body);
}

main().catch((err) => {
  console.error(err);
});

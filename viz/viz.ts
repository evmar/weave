import * as d3 from 'd3';
import * as wasm from 'wasm';

type IndexedSection = wasm.SectionHeader & {index:number};
interface State {
  module?: wasm.Module;
  sections?: IndexedSection[];
  hovered?: number;
}
const state: State = {};

function hover(sec: number|undefined) {
  if (sec === state.hovered) return;
  state.hovered = sec;
  render();
}

function pie() {
  const colors = d3.schemeSpectral[state.sections!.length];
  const svg = d3.select('#pie');
  const width = parseInt(svg.attr('width'));
  const height = parseInt(svg.attr('height'));
  svg.attr('viewBox', [-width / 2, -height / 2, width, height]);
  const arcs = d3.pie<IndexedSection>().padAngle(0.01).value((s) => s.len)(
    state.sections!
  );
  const arc = d3
    .arc<d3.PieArcDatum<wasm.SectionHeader>>()
    .innerRadius((width / 2) * 0.6)
    .outerRadius((width / 2) * 0.95);
  svg
    .select('g')
    .attr('stroke-linejoin', 'round')
    .attr('stroke-width', 2)
    .selectAll('path')
    .data(arcs)
    .join('path')
    .attr('fill', (d) => colors[d.data.index])
    .attr('stroke', (d) => d.data.index === state.hovered ? 'black' : 'none')
    .attr('d', arc)
    .on('mouseover', (ev, d) => hover(d.data.index))
    .on('mouseout', (ev, d) => hover(undefined));
  return svg.node()!;
}

function table() {
  const totalSize = d3.sum(state.sections!.map((sec) => sec.len));
  const table = d3.select('#table');
  table 
    .selectAll('tr')
    .data(state.sections!)
    .join('tr')
    .style('background', (d) => d.index === state.hovered ? '#eee' : 'none')
    .on('mouseover', (ev, d) => hover(d.index))
    .on('mouseout', (ev, d) => hover(undefined))
    .selectAll('td')
    .data((sec) => [
      { text: sec.type },
      {
        text: d3.format(',')(sec.len),
        align: 'right',
      },
      {
        text: d3.format('.1%')(sec.len / totalSize),
        align: 'right',
      },
    ])
    .join('td')
    .attr('align', (d) => d.align ?? null)
    .text((d) => d.text);
  return table.node()!;
}

function render() {
  pie();
  table();
}

async function main() {
  const wasmBytes = await (await fetch('t.wasm')).arrayBuffer();
  const module = wasm.read(new DataView(wasmBytes));
  state.module = module;
  state.sections = module.sections.map((sec, index) => ({...sec, index}));
  render();
}

main().catch((err) => {
  console.error(err);
});

import * as d3 from 'd3';
import * as wasm from 'wasm';

function render(module: wasm.Module) {
  const width = 120,
    height = 120;
  const colors = d3.schemeSpectral[module.sections.length];
  const svg = d3
    .create('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [-width / 2, -height / 2, width, height]);
  const arcs = d3.pie<wasm.SectionHeader>().value((s) => s.len)(
    module.sections
  );
  const arc = d3
    .arc<d3.PieArcDatum<wasm.SectionHeader>>()
    .innerRadius((width / 2) * 0.6)
    .outerRadius(width / 2);
  svg
    .append('g')
    .attr('stroke', 'white')
    .attr('stroke-width', 1)
    .attr('stroke-linejoin', 'round')
    .selectAll('path')
    .data(arcs)
    .join('path')
    .attr('fill', (d, i) => colors[i])
    .attr('d', arc)
    .append('title')
    .text((d) => d.data.type);
  return svg.node()!;
}

async function main() {
  const wasmBytes = await (await fetch('t.wasm')).arrayBuffer();
  const module = wasm.read(new DataView(wasmBytes));
  document.body.append(render(module));
}

main().catch(err => { console.error(err); });

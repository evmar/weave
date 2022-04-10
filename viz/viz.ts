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

function table(module: wasm.Module) {
  const table = d3.create('table');
  const totalSize = d3.sum(module.sections.map((sec) => sec.len));
  table // table headers
    .append('thead')
    .append('tr')
    .selectAll('th')
    .data([{ text: 'section' }, { text: 'size', align: 'right' }])
    .join('th')
    .attr('align', (d) => d.align ?? null)
    .text((d) => d.text);
  table // table data
    .append('tbody')
    .selectAll('tr')
    .data(module.sections)
    .join('tr')
    .selectAll('td')
    .data((sec) => [
      { text: sec.type },
      {
        text: `${sec.len} (${d3.format('.1%')(sec.len / totalSize)})`,
        align: 'right',
      },
    ])
    .join('td')
    .attr('align', (d) => d.align ?? null)
    .text((d) => d.text);
  return table.node()!;
}

async function main() {
  const wasmBytes = await (await fetch('t.wasm')).arrayBuffer();
  const module = wasm.read(new DataView(wasmBytes));
  document.body.append(render(module));
  document.body.append(table(module));
}

main().catch((err) => {
  console.error(err);
});

import * as d3 from 'd3';
import * as wasm from 'wasm';

function render() {
  const svg = d3.create('svg').attr('width', 400).attr('height', 400);
  return svg.node()!;
}

function main() {
  document.body.append(render());
}

main();

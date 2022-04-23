import * as wasm from 'wasm';
import * as d3 from 'd3';
import { h } from 'preact';
import * as preact from 'preact';
import { ParsedModule, Screen } from './viz';

interface SectionsPartProps {
  sections: (wasm.SectionHeader & { name?: string })[];
  onClick: (sec: wasm.SectionHeader) => void;
  onHover: (sec: wasm.SectionHeader | undefined) => void;
  hovered?: wasm.SectionHeader;
}
function Pie(props: SectionsPartProps) {
  const width = 200;
  const height = 200;
  const colors = props.sections.map((_, i) =>
    d3.interpolateBlues(i / props.sections.length)
  );
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
        strokeLinejoin='round'
        strokeWidth='2'
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
    <table style='flex:1' cellSpacing='0' cellPadding='0'>
      <thead>
        <tr>
          <th>section</th>
          <th className='right'>size</th>
          <th className='right'>%</th>
        </tr>
      </thead>
      <tbody id='table'>
        {props.sections.map((sec) => (
          <tr
            className={
              'pointer hover ' + (sec === props.hovered ? 'highlight' : '')
            }
            onMouseEnter={() => props.onHover(sec)}
            onMouseLeave={() => props.onHover(undefined)}
            onClick={() => props.onClick(sec)}
          >
            <td>{sec.name ?? sec.kind}</td>
            <td className='right'>{d3.format(',')(sec.len)}</td>
            <td className='right'>{d3.format('.1%')(sec.len / totalSize)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface SectionsProps {
  module: ParsedModule;
  sections: (wasm.SectionHeader & { name?: string })[];
  onClick: (sec: wasm.SectionHeader) => void;
}
interface SectionsState {
  hovered?: wasm.SectionHeader;
}
export class Sections extends preact.Component<SectionsProps, SectionsState> {
  private onSectionHover = (section: wasm.SectionHeader | undefined) => {
    this.setState({ hovered: section });
  };
  render(props: SectionsProps, state: SectionsState) {
    return (
      <Screen module={props.module} title='section overview'>
        <div style='display: flex; align-items: center; gap: 2ex'>
          <Pie {...props} {...state} onHover={this.onSectionHover} />
          <SectionTable {...props} {...state} onHover={this.onSectionHover} />
        </div>
      </Screen>
    );
  }
}

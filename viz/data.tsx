import * as wasm from 'wasm';
import { Indexed, ParsedModule } from './viz';
import { h } from 'preact';
import { Instructions } from './code';
import { Column, Table } from './table';
import * as d3 from 'd3';

export function DataSection(props: {
  module: ParsedModule;
  data: Indexed<wasm.DataSectionData>[];
  onClick: (row: Indexed<wasm.DataSectionData>) => void;
}) {
  const columns: Column<Indexed<wasm.DataSectionData>>[] = [
    {
      name: 'index',
      className: 'right',
      sort: null,
      data: (data) => data.index,
    },
    {
      name: 'size',
      className: 'right',
      sort: (a, b) => b.init.byteLength - a.init.byteLength,
      data: (data) => data.init.byteLength,
    },
    {
      name: 'init',
      data: (data) => {
        if (data.memidx === undefined) return 'passive';
        return <Instructions module={props.module} instrs={data.offset!} />;
      },
    },
  ];

  return (
    <Table columns={columns} onClick={props.onClick}>
      {props.data}
    </Table>
  );
}

function hex(byte: number): string {
  return byte.toString(16).padStart(2, '0');
}

export function DataHex(props: {
  module: ParsedModule;
  data: Indexed<wasm.DataSectionData>;
}) {
  const view = props.data.init;
  const rows = [];
  for (let row = 0; row < 20 && row * 16 < view.byteLength; row++) {
    let line = '';
    for (let col = 0; col < 16; col++) {
      const index = row * 16 + col;
      if (index >= view.byteLength) break;
      line += hex(view.getUint8(index)) + ' ';
    }
    rows.push(<div>{line}</div>);
  }

  return (
    <div>
      <div>
        <b>data[{props.data.index}]</b>:{' '}
        {d3.format(',')(props.data.init.byteLength)} bytes
      </div>
      <div>
        <b>init</b>:{' '}
        <Instructions module={props.module} instrs={props.data.offset!} />
      </div>
      <pre>{rows}</pre>
    </div>
  );
}

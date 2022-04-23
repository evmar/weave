import * as wasm from 'wasm';
import { Indexed, ParsedModule, Screen } from './viz';
import { h } from 'preact';
import * as hooks from 'preact/hooks';
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
    <Screen module={props.module} title='"data" section'>
      <p>Initialization-time data.</p>
      <Table columns={columns} onClick={props.onClick}>
        {props.data}
      </Table>
    </Screen>
  );
}

function hex(byte: number, pad = 2): string {
  return byte.toString(16).padStart(pad, '0');
}

export function DataHex(props: {
  module: ParsedModule;
  data: Indexed<wasm.DataSectionData>;
}) {
  const [hover, setHover] = hooks.useState<number | null>(null);

  const visibleRows = 20;
  const view = props.data.init;
  const rows = [];
  for (let row = 0; row < visibleRows && row * 16 < view.byteLength; row++) {
    const hexBytes = [];
    const vizBytes = [];
    for (let col = 0; col < 16; col++) {
      const index = row * 16 + col;
      if (index >= view.byteLength) break;
      const byte = view.getUint8(index);
      const hexByte = hex(byte);
      const vizByte =
        byte >= 0x20 && byte < 0x7f ? String.fromCharCode(byte) : '.';
      hexBytes.push(
        ' ',
        <span
          onMouseOver={() => setHover(index)}
          className={index === hover ? 'highlight' : ''}
        >
          {hexByte}
        </span>
      );
      vizBytes.push(
        <span
          onMouseOver={() => setHover(index)}
          className={index === hover ? 'highlight' : ''}
        >
          {vizByte}
        </span>
      );
    }
    rows.push(
      <div>
        {hex(row * 16, 6)} {hexBytes}
        {'  '}
        {vizBytes}
      </div>
    );
  }

  return (
    <Screen module={props.module} title={`data[${props.data.index}]`}>
      <div>
        <b>size</b>: {d3.format(',')(props.data.init.byteLength)} bytes
      </div>
      <div>
        <b>init</b>: <Instructions module={props.module} instrs={props.data.offset!} />
      </div>
      <pre>{rows}</pre>
    </Screen>
  );
}

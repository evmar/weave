import * as d3 from 'd3';
import { h } from 'preact';
import * as preact from 'preact';
import * as wasm from 'wasm';
import { Instructions } from './code';
import { Column, Table } from './table';
import { Indexed, ParsedModule, Screen } from './viz';

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
    <Screen title='"data" section'>
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

namespace HexView {
  export interface Props {
    data: DataView;
  }
  export interface State {
    hover?: number;
  }
}
export class HexView extends preact.Component<HexView.Props, HexView.State> {
  render() {
    const visibleRows = 100;
    const view = this.props.data;
    const rows = [];
    for (let row = 0; row < visibleRows && row * 16 < view.byteLength; row++) {
      const hexBytes = [];
      const vizBytes = [];
      for (let col = 0; col < 16; col++) {
        const index = row * 16 + col;
        if (index >= view.byteLength) {
          hexBytes.push('   ');
          vizBytes.push(' ');
          continue;
        }
        const byte = view.getUint8(index);
        const hexByte = hex(byte);
        const vizByte = byte >= 0x20 && byte < 0x7f ? String.fromCharCode(byte) : '.';
        if (col === 8) hexBytes.push(' ');
        hexBytes.push(
          ' ',
          <span
            onMouseOver={() => this.setState({ hover: index })}
            className={index === this.state.hover ? 'highlight' : ''}
          >
            {hexByte}
          </span>,
        );
        vizBytes.push(
          <span
            onMouseOver={() => this.setState({ hover: index })}
            className={index === this.state.hover ? 'highlight' : ''}
          >
            {vizByte}
          </span>,
        );
      }
      rows.push(
        <div>
          {hex(row * 16, 6)} {hexBytes}{'  '}{vizBytes}
        </div>,
      );
    }
    return <pre class='hex'>{rows}</pre>;
  }
}

export function DataHex(props: {
  module: ParsedModule;
  data: Indexed<wasm.DataSectionData>;
}) {
  return (
    <Screen title={`data[${props.data.index}]`}>
      <table>
        <tr>
          <th className='right'>size</th>
          <td>{d3.format(',')(props.data.init.byteLength)} bytes</td>
        </tr>
        <tr>
          <th className='right'>init</th>
          <td>
            <Instructions module={props.module} instrs={props.data.offset!} />
          </td>
        </tr>
      </table>
      <HexView data={props.data.init} />
    </Screen>
  );
}

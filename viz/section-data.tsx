/**
 * The contents of the wasm "data" section, including a hex viewer.
 */

import * as d3 from 'd3';
import { h } from 'preact';
import * as preact from 'preact';
import * as wasm from 'wasm';
import { Instructions } from './section-code';
import { Column, Table } from './table';
import { Screen } from './viz';
import { Indexed, ParsedModule } from './module';
import { classNames } from './css';

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

  if (props.module.dataNames) {
    columns.splice(1, 0, {
      name: 'name',
      data: (data) => props.module.dataNames.get(data.index),
    });
  }

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

/** Component to display a hex dump of some data. */
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
            className={classNames({ highlight: index === this.state.hover })}
          >
            {hexByte}
          </span>,
        );
        vizBytes.push(
          <span
            onMouseOver={() => this.setState({ hover: index })}
            className={classNames({ highlight: index === this.state.hover })}
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

/** Component to display a full-page view of a specific data blob in the wasm module. */
export function DataHex(props: {
  module: ParsedModule;
  data: Indexed<wasm.DataSectionData>;
}) {
  const name = props.module.dataNames.get(props.data.index);
  return (
    <Screen title={`data[${props.data.index}]`}>
      <table>
        {name ?
          <tr>
            <th>name</th>
            <td>{name}</td>
          </tr>
          : null}
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

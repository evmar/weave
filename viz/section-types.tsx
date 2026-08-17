/**
 * The contents of the wasm "types" section.
 */

import * as preact from 'preact';
import * as wasm from 'wasm';
import { FunctionType, Indexed, ParsedModule } from './module';
import { Column, Table } from './table';
import { Screen } from './viz';

export function TypeSection(props: { module: ParsedModule }) {
  const columns: Column<Indexed<wasm.FuncType>>[] = [
    { name: 'index', className: 'right', data: (row) => row.index },
    {
      name: 'type',
      cellClass: 'break-all',
      data: (type) => <FunctionType type={type} />,
    },
  ];
  return (
    <Screen title='"type" section'>
      <p>One entry per distinct function type used in the module.</p>
      <Table columns={columns}>
        {props.module.types.map((t, i) => ({ ...t, index: i }))}
      </Table>
    </Screen>
  );
}

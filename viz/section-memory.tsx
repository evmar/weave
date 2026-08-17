/**
 * The contents of the wasm "mems" section.
 */

import * as preact from 'preact';
import * as wasm from 'wasm';
import { Indexed, ParsedModule } from './module';
import { Column, Table } from './table';
import { Screen } from './viz';

export function MemorySection(props: { module: ParsedModule }) {
  const columns: Column<Indexed<wasm.Limits>>[] = [
    { name: 'index', className: 'right', data: (limits) => limits.index },
    { name: 'limits', data: (limits) => wasm.limitsToString(limits) },
  ];
  return (
    <Screen title='"memory" section'>
      <p>Definition of memory. Currently limited to one entry.</p>
      <Table columns={columns}>{props.module.memories}</Table>
    </Screen>
  );
}

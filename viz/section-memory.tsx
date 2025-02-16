/**
 * The contents of the wasm "mems" section.
 */

import { Indexed, ParsedModule } from './module';
import { Screen } from './viz';
import { Column, Table } from './table';
import * as wasm from 'wasm';
import * as preact from 'preact';

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
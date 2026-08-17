/**
 * The contents of the wasm "tables" section.
 */

import * as preact from 'preact';
import * as wasm from 'wasm';
import { Indexed, ParsedModule } from './module';
import { Column, Table } from './table';
import { Screen } from './viz';

export function TableSection(props: { module: ParsedModule }) {
  const columns: Column<Indexed<wasm.TableType>>[] = [
    { name: 'index', className: 'right', data: (table) => table.index },
    { name: 'limits', data: (table) => wasm.limitsToString(table.limits) },
    { name: 'type', data: (table) => table.element },
  ];
  return (
    <Screen title='"table" section'>
      <p>
        Collections of opaque references. (Wasm 1.0 only allowed a single table.)
      </p>
      <Table columns={columns}>{props.module.tables}</Table>
    </Screen>
  );
}

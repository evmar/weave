/**
 * The contents of the wasm "tables" section.
 */

import { Indexed, ParsedModule } from './module';
import { Screen } from './viz';
import { Fragment, h } from 'preact';
import { Column, Table } from './table';
import * as wasm from 'wasm';

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
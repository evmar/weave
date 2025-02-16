/**
 * The contents of the wasm "funcs" section.
 */

import { FunctionSpan, FunctionType, Indexed, ParsedModule } from './module';
import { Screen } from './viz';
import { Column, Table } from './table';
import * as wasm from 'wasm';
import * as preact from 'preact';

export function FunctionSection(props: {
  module: ParsedModule;
  onClick: (index: number) => void;
}) {
  const columns: Column<Indexed<FunctionSpan>>[] = [
    { name: 'func', className: 'right', data: (row) => row.index },
    {
      name: 'type',
      data: (row) => <code>{wasm.funcTypeToString(props.module.types[row.typeidx])}</code>,
    },
  ];
  return (
    <Screen title='"function" section'>
      <p>Associates functions with their types.</p>
      <Table columns={columns} onClick={(row) => props.onClick(row.index)}>
        {props.module.functions}
      </Table>
    </Screen>
  );
}
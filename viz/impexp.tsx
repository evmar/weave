import {
  Screen,
  FunctionRef,
  FunctionType,
  Indexed,
  ParsedModule,
} from './viz';
import * as wasm from 'wasm';
import { h, Fragment } from 'preact';
import { Column, Table } from './table';

function ImpExpDesc(props: {
  module: ParsedModule;
  desc: wasm.Import['desc'] | wasm.Export['desc'];
}) {
  switch (props.desc.type) {
    case wasm.DescType.typeidx:
      return <FunctionType type={props.module.types[props.desc.index]} />;
    case wasm.DescType.funcidx:
      return <FunctionRef module={props.module} index={props.desc.index} />;
    default:
      return <>{wasm.descToString(props.desc)}</>;
  }
}

export function Imports(props: { module: ParsedModule }) {
  const columns: Column<Indexed<wasm.Import>>[] = [
    { name: 'index', className: 'right', data: (imp) => imp.index },
    {
      name: 'name',
      cellClass: 'break-all',
      data: (imp) => (
        <code>
          {imp.module}.{imp.name}
        </code>
      ),
    },
    {
      name: 'desc',
      cellClass: 'nowrap',
      data: (imp) => <ImpExpDesc module={props.module} desc={imp.desc} />,
    },
  ];
  return (
    <Screen module={props.module} title='"import" section'>
      <Table columns={columns}>{props.module.imports}</Table>
    </Screen>
  );
}

export function Exports(props: { module: ParsedModule }) {
  const columns: Column<wasm.Export>[] = [
    {
      name: 'name',
      cellClass: 'break-all',
      data: (exp) => <code>{exp.name}</code>,
    },
    {
      name: 'desc',
      cellClass: 'nowrap',
      data: (imp) => <ImpExpDesc module={props.module} desc={imp.desc} />,
    },
  ];
  return (
    <Screen module={props.module} title='"export" section'>
      <Table columns={columns}>{props.module.exports}</Table>
    </Screen>
  );
}

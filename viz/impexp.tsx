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
  index?: number,
}) {
  switch (props.desc.type) {
    case wasm.DescType.typeidx:
      return <div>function {props.index}: <FunctionType type={props.module.types[props.desc.index]} /></div>;
    case wasm.DescType.funcidx:
      return <div>function {props.desc.index}: <FunctionRef module={props.module} index={props.desc.index} /></div>;
    default:
      return <div>{wasm.descToString(props.desc)}</div>;
  }
}

export function Imports(props: { module: ParsedModule }) {
  const columns: Column<Indexed<wasm.Import>>[] = [
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
      data: (imp) => <ImpExpDesc module={props.module} index={imp.index} desc={imp.desc} />,
    },
  ];
  return (
    <Screen module={props.module} title='"import" section'>
      <p>Functions etc. imported from the host environment.</p>
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
      data: (exp) => <ImpExpDesc module={props.module} desc={exp.desc} />,
    },
  ];
  return (
    <Screen module={props.module} title='"export" section'>
      <p>Functions etc. exported to the host environment.</p>
      <Table columns={columns}>{props.module.exports}</Table>
    </Screen>
  );
}

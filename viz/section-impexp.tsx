/**
 * The contents of the wasm "imports" and "exports" sections.
 */

import * as wasm from 'wasm';
import { Column, Table } from './table';
import { Link, Screen } from './viz';
import { FunctionRef, FunctionType, Indexed, ParsedModule } from './module';
import * as preact from 'preact';

function ImpExpDesc(props: {
  module: ParsedModule;
  desc: wasm.Import['desc'] | wasm.Export['desc'];
  index?: number;
}) {
  switch (props.desc.kind) {
    case wasm.DescKind.typeidx:
      return (
        <div>
          function {props.index}: <FunctionType type={props.module.types[props.desc.index]} />
        </div>
      );
    case wasm.DescKind.funcidx:
      return (
        <div>
          function {props.desc.index}: <FunctionRef module={props.module} index={props.desc.index} />
        </div>
      );
    case wasm.DescKind.tableidx: {
      const sec = props.module.sections.findIndex(
        (sec) => sec.kind === wasm.SectionKind.table,
      )!;
      return (
        <div>
          <Link target={['section', sec]}>table {props.desc.index}</Link>
        </div>
      );
    }
    case wasm.DescKind.memidx: {
      const sec = props.module.sections.findIndex(
        (sec) => sec.kind === wasm.SectionKind.memory,
      )!;
      return (
        <div>
          <Link target={['section', sec]}>memory {props.desc.index}</Link>
        </div>
      );
    }
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
      data: (imp) => <ImpExpDesc module={props.module} index={imp.index} desc={imp.desc} />,
    },
  ];
  return (
    <Screen title='"import" section'>
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
      cellClass: 'break-all',
      data: (exp) => <ImpExpDesc module={props.module} desc={exp.desc} />,
    },
  ];
  return (
    <Screen title='"export" section'>
      <p>Functions etc. exported to the host environment.</p>
      <Table columns={columns}>{props.module.exports}</Table>
    </Screen>
  );
}

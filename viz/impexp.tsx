import { FunctionType, ParsedModule } from "./viz";
import * as wasm from 'wasm';
import { h, Fragment } from "preact";

function ImpExpDesc(props: {
  module: ParsedModule;
  desc: wasm.Import['desc'] | wasm.Export['desc'];
}) {
  switch (props.desc.type) {
    case wasm.DescType.typeidx:
      return <FunctionType type={props.module.types[props.desc.index]} />;
    default:
      return <>wasm.descToString(props.desc)</>;
  }
}

export function Imports(props: { module: ParsedModule }) {
  const imports = props.module.imports;
  return (
    <table>
      <thead>
        <tr>
          <th className='right'>index</th>
          <th>name</th>
          <th>desc</th>
        </tr>
      </thead>
      <tbody>
        {imports.map((imp) => (
          <tr>
            <td className='right'>{imp.index}</td>
            <td className='break-all'>
              <code>
                {imp.module}.{imp.name}
              </code>
            </td>
            <td className='nowrap'>
              <ImpExpDesc module={props.module} desc={imp.desc} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Exports(props: { children: wasm.Export[] }) {
  const exports = props.children;
  return (
    <table>
      <thead>
        <tr>
          <th>name</th>
          <th>desc</th>
        </tr>
      </thead>
      <tbody>
        {exports.slice(0, 100).map((exp) => (
          <tr>
            <td className='break-all'>
              <code>{exp.name}</code>
            </td>
            <td className='nowrap'>{wasm.descToString(exp.desc)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * The contents of the wasm "names" section.
 */

import { ParsedModule } from './module';
import { Screen } from './viz';
import * as preact from 'preact';

export function NamesSection(props: { module: ParsedModule }) {
  const sec = props.module.names!;
  return (
    <Screen title='"name" section'>
      <p>
        Names for objects found in the file, typically for debugging purposes.
      </p>
      <table>
        <tr>
          <th className='right'>module name</th>
          <td>{sec.moduleName ?? <i>none</i>}</td>
        </tr>
        <tr>
          <th className='right'>local names</th>
          <td>{sec.localNames?.size ?? <i>none</i>}</td>
        </tr>
        <tr>
          <th className='right'>function names</th>
          <td>{sec.functionNames?.size ?? <i>none</i>}</td>
        </tr>
        <tr>
          <th className='right'>global names</th>
          <td>{sec.globalNames?.size ?? <i>none</i>}</td>
        </tr>
        <tr>
          <th className='right'>data names</th>
          <td>{sec.dataNames?.size ?? <i>none</i>}</td>
        </tr>
      </table>
    </Screen>
  );
}

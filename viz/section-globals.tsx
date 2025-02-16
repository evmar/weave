/**
 * The contents of the wasm "globals" section.
 */

import { ParsedModule } from './module';
import { Instructions } from './section-code';
import { InlineEdit } from './inline-edit';
import { Screen } from './viz';
import { Fragment, h } from 'preact';
import * as hooks from 'preact/hooks';

export function GlobalSection(props: { module: ParsedModule }) {
  const [edited, setEdited] = hooks.useState(0);

  return (
    <Screen title='"globals" section'>
      <p>Global variables, accessible to both the host environment and Wasm.</p>
      <table>
        <thead>
          <tr>
            <th className='right'>index</th>
            <th>name</th>
            <th>type</th>
            <th>init</th>
          </tr>
        </thead>
        <tbody>
          {props.module.globals.map((global) => {
            return (
              <tr>
                <td className='right'>{global.index}</td>
                <td className='break-all flex-container'>
                  <InlineEdit
                    onEdit={(name) => {
                      props.module.globalNames.set(global.index, name);
                      setEdited(edited + 1);
                    }}
                  >
                    {props.module.globalNames.get(global.index) ?? ''}
                  </InlineEdit>
                </td>
                <td>
                  {global.type.mut ? 'var' : 'const'} {global.type.valType}
                </td>
                <td>
                  <Instructions module={props.module} instrs={global.init} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Screen>
  );
}

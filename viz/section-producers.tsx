/**
 * The contents of the wasm "producers" section.
 */

import { ParsedModule } from './module';
import { Screen } from './viz';
import { Fragment, h } from 'preact';

export function ProducersSection(props: { module: ParsedModule }) {
  return (
    <Screen title='"producers" section'>
      <p>
        <a href='https://github.com/WebAssembly/tool-conventions/blob/main/ProducersSection.md'>
          Tools used
        </a>{' '}
        to produce the module.
      </p>
      <table>
        {props.module.producers!.map((field) => (
          <tr>
            <td>{field.name}</td>
            <td>
              {field.values.map(({ name, version }) => (
                <div>
                  {name} {version}
                </div>
              ))}
            </td>
          </tr>
        ))}
      </table>
    </Screen>
  );
}
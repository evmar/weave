/**
 * The contents of the wasm "elems" section.
 */

import { Indexed, ParsedModule } from './module';
import { Screen } from './viz';
import { Fragment, h } from 'preact';
import { Column, Table } from './table';
import * as wasm from 'wasm';
import { Instructions } from './section-code';

export function ElementSection(props: { module: ParsedModule }) {
  const columns: Column<Indexed<wasm.Element>>[] = [
    { name: 'index', className: 'right', data: (elem) => elem.index },
    { name: 'type', data: (elem) => elem.type },
    {
      name: 'init',
      data: (elem) => `${elem.init.length} entries`,
    },
    {
      name: 'mode',
      data: (elem) => {
        if (elem.mode === wasm.ElementMode.active) {
          return (
            <div>
              active table={elem.table}
              <br />
              offset:
              <Instructions module={props.module} instrs={elem.offset} />
            </div>
          );
        } else {
          return elem.mode;
        }
      },
    },
  ];
  return (
    <Screen title='"element" section'>
      <p>Initializers for tables.</p>
      <Table columns={columns}>{props.module.elements}</Table>
    </Screen>
  );
}
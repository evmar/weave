import * as wasm from 'wasm';
import { ParsedModule } from "./viz";
import * as preact from 'preact';
import { h, Fragment } from 'preact';
import * as hooks from 'preact/hooks';
import { Instructions } from './code';

export function DataSection(props: { module: ParsedModule; data: wasm.DataSectionData[] }) {
  const [sortBy, setSortBy] = hooks.useState<undefined|'size'>(undefined);
  const [expanded, setExpanded] = hooks.useState(false);

  const data = hooks.useMemo(() => {
    let data = props.data.map((d, i) => ({...d, index: i}));
    if (sortBy === 'size') {
      data.sort((a, b) => b.init.byteLength - a.init.byteLength);
    }
    if (!expanded && data.length > 50) {
      data = data.slice(0, 50);
    }
    return data;
  }, [sortBy, expanded]);

  return (
    <table cellSpacing="0" cellPadding="0">
      <thead>
        <tr>
          <th className='pointer right' onClick={() => setSortBy(undefined)}>index</th>
          <th className='pointer right' onClick={() => setSortBy('size')}>size{sortBy === 'size' && ' \u2193'}</th>
          <th>init</th>
        </tr>
      </thead>
      <tbody>
        {data.map((data) => {
          return (
            <tr className="pointer hover">
              <td className='right'>{data.index}</td>
              <td className='right'>{data.init.byteLength}</td>
              <td>
                {data.memidx === undefined ? (
                  'passive'
                ) : (
                  <Instructions module={props.module} instrs={data.offset!} />
                )}
              </td>
            </tr>
          );
        })}
        {data.length < props.data.length &&
          <button onClick={() => setExpanded(true)}>show all</button>}
      </tbody>
    </table>
  );
}

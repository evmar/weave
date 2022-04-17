import { sort } from 'd3';
import * as preact from 'preact';
import { h } from 'preact';
import * as hooks from 'preact/hooks';

export interface Column<T> {
  name: string;
  className?: string;
  cellClass?: string;
  sort?: ((a: T, b: T) => number) | null;
  data: (row: T) => preact.ComponentChild;
}

export interface TableProps<T extends { index: number }> {
  columns: Column<T>[];
  children: T[];
  onClick?: (row: T) => void;
}

export function Table<T extends { index: number }>(props: TableProps<T>) {
  const [sortBy, setSortBy] = hooks.useState<undefined | Column<T>>(undefined);
  const [expanded, setExpanded] = hooks.useState(false);

  const rows = hooks.useMemo(() => {
    let rows = [...props.children];
    if (sortBy && sortBy.sort) {
      rows.sort(sortBy.sort);
    }
    if (!expanded) {
      rows = rows.slice(0, 50);
    }
    return rows;
  }, [props.children, sortBy, expanded]);

  return (
    <table cellSpacing='0' cellPadding='0'>
      <thead>
        <tr>
          {props.columns.map((col) => {
            const canSort = col.sort !== undefined;
            return (
              <th
                className={(col.className ?? '') + (canSort ? ' pointer' : '')}
                onClick={canSort ? () => setSortBy(col) : undefined}
              >
                {col.name}
                {sortBy === col && ' \u2193'}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          return (
            <tr
              key={row.index}
              className={props.onClick ? 'hover pointer' : ''}
              onClick={props.onClick && (() => props.onClick!(row))}
            >
              {props.columns.map((col) => {
                return (
                  <td className={col.className + ' ' + col.cellClass}>
                    {col.data(row)}
                  </td>
                );
              })}
            </tr>
          );
        })}
        {rows.length < props.children.length && (
          <tr>
            <td colSpan={props.columns.length}>
              <button onClick={() => setExpanded(true)}>
                show {props.children.length - rows.length} more
              </button>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

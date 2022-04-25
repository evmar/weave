import * as preact from 'preact';
import { h } from 'preact';
import { memo } from './memo';

export interface Column<T> {
  name: string;
  className?: string;
  cellClass?: string;
  sort?: ((a: T, b: T) => number) | null;
  data: (row: T) => preact.ComponentChild;
}

interface Props<T> {
  columns: Column<T>[];
  onClick?: (row: T) => void;
  children: T[];
}

interface State<T> {
  sortBy?: Column<T>;
  expanded: boolean;
}

export class Table<T> extends preact.Component<Props<T>, State<T>> {
  state: State<T> = { expanded: false };

  shouldComponentUpdate(
    nextProps: Readonly<Props<T>>,
    nextState: Readonly<State<T>>
  ): boolean {
    return this.props !== nextProps || this.state !== nextState;
  }

  rows = memo(function (
    sortBy: Column<T> | undefined,
    expanded: boolean,
    rows: T[]
  ) {
    rows = [...rows];
    if (sortBy && sortBy.sort) {
      rows.sort(sortBy.sort);
    }
    if (!expanded) {
      rows = rows.slice(0, 50);
    }
    return rows;
  });

  render() {
    const rows = this.rows(
      this.state.sortBy,
      this.state.expanded,
      this.props.children
    );
    return (
      <table cellSpacing='0' cellPadding='0'>
        <thead>
          <tr>
            {this.props.columns.map((col) => {
              const canSort = col.sort !== undefined;
              return (
                <th
                  className={
                    (col.className ?? '') + (canSort ? ' pointer' : '')
                  }
                  onClick={
                    canSort ? () => this.setState({ sortBy: col }) : undefined
                  }
                >
                  {col.name}
                  {this.state.sortBy === col && ' \u2193'}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            return (
              <tr
                className={this.props.onClick ? 'hover pointer' : ''}
                onClick={this.props.onClick && (() => this.props.onClick!(row))}
              >
                {this.props.columns.map((col) => {
                  return (
                    <td className={col.className + ' ' + col.cellClass}>
                      {col.data(row)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {rows.length < this.props.children.length && (
            <tr>
              <td colSpan={this.props.columns.length}>
                <button onClick={() => this.setState({ expanded: true })}>
                  show {this.props.children.length - rows.length} more
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    );
  }
}

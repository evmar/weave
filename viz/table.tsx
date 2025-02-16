/**
 * Table component used for tabular data with sorting.
 */

import * as preact from 'preact';
import { h } from 'preact';
import { memo } from './memo';
import { classNames } from './css';

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
  limit: number;
}

export class Table<T> extends preact.Component<Props<T>, State<T>> {
  state: State<T> = { limit: 100 };

  shouldComponentUpdate(
    nextProps: Readonly<Props<T>>,
    nextState: Readonly<State<T>>,
  ): boolean {
    return this.props !== nextProps || this.state !== nextState;
  }

  rows = memo(function (
    sortBy: Column<T> | undefined,
    limit: number,
    rows: T[],
  ) {
    rows = [...rows];
    if (sortBy && sortBy.sort) {
      rows.sort(sortBy.sort);
    }
    if (limit < rows.length) {
      rows = rows.slice(0, limit);
    }
    return rows;
  });

  render() {
    const rows = this.rows(
      this.state.sortBy,
      this.state.limit,
      this.props.children,
    );
    return (
      <table cellSpacing='0' cellPadding='0'>
        <thead>
          <tr>
            {this.props.columns.map((col) => {
              const canSort = col.sort !== undefined;
              return (
                <th
                  className={classNames(col.className, { pointer: canSort })}
                  onClick={canSort ? () => this.setState({ sortBy: col }) : undefined}
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
                className={classNames({ 'hover pointer': !!this.props.onClick })}
                onClick={this.props.onClick && (() => this.props.onClick!(row))}
              >
                {this.props.columns.map((col) => {
                  return (
                    <td className={classNames(col.className, col.cellClass)}>
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
                <button
                  onClick={() => this.setState({ limit: this.state.limit + 1000 })}
                >
                  show {Math.min(
                    1000,
                    this.props.children.length - this.rows.length,
                  )} more
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    );
  }
}

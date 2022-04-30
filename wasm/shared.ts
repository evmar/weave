/** Common Wasm types found across sections. */

import { Reader } from './reader';
import { readValType, Type } from './type';

export enum DescKind {
  table = 'table',
  mem = 'mem',
  global = 'global',

  funcidx = 'funcidx',
  typeidx = 'typeidx',
  tableidx = 'tableidx',
  memidx = 'memidx',
  globalidx = 'globalidx',
}

export interface DescTable {
  kind: DescKind.table;
  table: TableType;
}

export interface DescMem {
  kind: DescKind.mem;
  limits: Limits;
}

export interface DescGlobal {
  kind: DescKind.global;
  globalType: GlobalType;
}

export interface DescIndex<T> {
  kind: T;
  index: number;
}
type DescIndexKinds =
  | DescIndex<DescKind.funcidx>
  | DescIndex<DescKind.typeidx>
  | DescIndex<DescKind.tableidx>
  | DescIndex<DescKind.memidx>
  | DescIndex<DescKind.globalidx>;

export function descToString(
  desc: DescTable | DescMem | DescGlobal | DescIndexKinds
): string {
  switch (desc.kind) {
    case DescKind.table:
      return `table ${desc.table}`;
    case DescKind.mem:
      return `mem ${limitsToString(desc.limits)}`;
    case DescKind.global:
      return `mem ${desc}`;
    default:
      return `${desc.kind} index ${desc.index}`;
  }
}

export interface Limits {
  minimum: number;
  maximum?: number;
}

export function readLimits(r: Reader): Limits {
  const b = r.read8();
  let minimum: number;
  let maximum: number | undefined;
  switch (b) {
    case 0:
      minimum = r.readUint();
      break;
    case 1:
      minimum = r.readUint();
      maximum = r.readUint();
      break;
    default:
      throw new Error(`invalid limits flag ${b.toString(16)}`);
  }
  return { minimum, maximum };
}

export function limitsToString(limits: Limits) {
  return `min=${limits.minimum} max=${limits.maximum ?? 'none'}`;
}

export interface TableType {
  element: Type;
  limits: Limits;
}

export function readTable(r: Reader): TableType {
  const element = readValType(r);
  const limits = readLimits(r);
  return { element, limits };
}

export interface GlobalType {
  valType: Type;
  mut: boolean;
}

export function readGlobalType(r: Reader): GlobalType {
  const valType = readValType(r);
  const mutB = r.read8();
  let mut;
  switch (mutB) {
    case 0:
      mut = false;
      break;
    case 1:
      mut = true;
      break;
    default:
      throw new Error(`invalid mutability flag ${mutB.toString(16)}`);
  }
  return { valType, mut };
}

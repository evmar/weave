import * as code from './code';
import { Reader } from './reader';
import {
  DescGlobal,
  DescIndex,
  DescMem,
  DescTable,
  descToString,
  DescKind,
  GlobalType,
  readGlobalType,
  readLimits,
  readTable,
  TableType,
} from './shared';
import { FuncType, readFuncType } from './type';

export enum SectionKind {
  custom = 'custom',
  type = 'type',
  import = 'import',
  function = 'function',
  table = 'table',
  memory = 'memory',
  global = 'global',
  export = 'export',
  start = 'start',
  element = 'element',
  code = 'code',
  data = 'data',
  data_count = 'data count',
}

export interface CustomSection {
  name: string;
}

/** Leaves the reader in a state ready to read the content of the section. */
export function readCustomSection(r: Reader): CustomSection {
  const name = r.name();
  return { name };
}

export interface NameSection {
  moduleName?: string;
  functionNames?: Map<number, string>;
  globalNames?: Map<number, string>;
  dataNames?: Map<number, string>;
}

function readNameMap(r: Reader): Map<number, string> {
  const len = r.readUint();
  const map = new Map();
  for (let i = 0; i < len; i++) {
    map.set(r.readUint(), r.name());
  }
  return map;
}

export function readNameSection(r: Reader): NameSection {
  let sec: NameSection = {};
  while (!r.done()) {
    const b = r.read8();
    const size = r.readUint();
    // https://github.com/WebAssembly/extended-name-section/blob/main/proposals/extended-name-section/Overview.md
    switch (b) {
      case 0:
        sec.moduleName = r.name();
        break;
      case 1:
        sec.functionNames = readNameMap(r);
        break;
      case 2:
        console.warn(`unimplemented 'local name' subsection`);
        r.skip(size);
        break;
      case 7:
        sec.globalNames = readNameMap(r);
        break;
      case 9:
        sec.dataNames = readNameMap(r);
        break;
      default:
        console.warn(`ignoring unknown name subsection id ${b.toString(16)}`);
        r.skip(size);
        break;
    }
  }
  return sec;
}

export function readTypeSection(r: Reader): FuncType[] {
  return r.vec(readFuncType);
}

export interface Import {
  module: string;
  name: string;
  desc: DescIndex<DescKind.typeidx> | DescTable | DescMem | DescGlobal;
}

export function importToString(imp: Import): string {
  return `${imp.module}.${imp.name} (${descToString(imp.desc)})`;
}

export function readImportSection(r: Reader): Import[] {
  return r.vec(() => {
    const module = r.name();
    const name = r.name();
    const desc8 = r.read8();
    let desc: Import['desc'];
    switch (desc8) {
      case 0:
        desc = { kind: DescKind.typeidx, index: r.readUint() };
        break;
      case 1:
        desc = { kind: DescKind.table, table: readTable(r) };
        break;
      case 2:
        desc = { kind: DescKind.mem, limits: readLimits(r) };
        break;
      case 3:
        desc = { kind: DescKind.global, globalType: readGlobalType(r) };
        break;
      default:
        throw new Error(`unhandled import desc type ${desc8.toString(16)}`);
    }
    return { module, name, desc };
  });
}

export function readFunctionSection(r: Reader): number[] {
  return r.vec(() => r.readUint());
}

export function readTableSection(r: Reader): TableType[] {
  return r.vec(() => readTable(r));
}

export interface Global {
  type: GlobalType;
  init: code.Instruction[];
}
export function readGlobalSection(r: Reader): Global[] {
  return r.vec(() => {
    return { type: readGlobalType(r), init: code.readExpr(r) };
  });
}

export interface Export {
  name: string;
  desc:
    | DescIndex<DescKind.funcidx>
    | DescIndex<DescKind.tableidx>
    | DescIndex<DescKind.memidx>
    | DescIndex<DescKind.globalidx>;
}
export function exportToString(exp: Export): string {
  return `${exp.name} (${descToString(exp.desc)})`;
}
export function readExportSection(r: Reader): Export[] {
  return r.vec(() => {
    const name = r.name();
    const desc8 = r.read8();
    let desc: Export['desc'];
    const kind = (
      [
        DescKind.funcidx,
        DescKind.tableidx,
        DescKind.memidx,
        DescKind.globalidx,
      ] as const
    )[desc8];
    if (!kind) {
      throw new Error(`unhandled export desc type ${desc8.toString(16)}`);
    }
    return { name, desc: { kind, index: r.readUint() } };
  });
}

export interface DataSectionData {
  init: DataView;
  memidx?: number;
  offset?: code.Instruction[];
}
export function readDataSection(r: Reader): DataSectionData[] {
  return r.vec(() => {
    const flags = r.read8();
    switch (flags) {
      case 0: {
        const expr = code.readExpr(r);
        const len = r.readUint();
        return { init: r.slice(len), memidx: 0, offset: expr };
      }
      case 1: {
        const len = r.readUint();
        return { init: r.slice(len) };
      }
      default:
        throw new Error(
          `unhandled data section data flags ${flags.toString(16)}`
        );
    }
  });
}

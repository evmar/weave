import * as code from './code';
import { Reader } from './reader';
import { FuncType, readFuncType, readValType, Type } from './type';

export { FuncType, funcTypeToString } from './type';

export enum SectionType {
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

export interface SectionHeader {
  index: number;
  type: SectionType;
  ofs: number;
  len: number;
}

export class Module {
  constructor(private buffer: ArrayBuffer, public sections: SectionHeader[]) {}

  getReader(section: SectionHeader) {
    return new Reader(new DataView(this.buffer, section.ofs, section.len));
  }
}

class Parser {
  private r: Reader;
  constructor(private view: DataView) {
    this.r = new Reader(view);
  }

  readFileHeader(): void {
    const magic = this.r.read32();
    if (magic !== 0x6d736100)
      throw new Error(`invalid signature: ${magic.toString(16)}`);
    const version = this.r.read32();
    if (version !== 1)
      throw new Error(`bad version, expected 1, got ${version}`);
  }

  readSectionHeader(index: number): SectionHeader {
    const id = this.r.read8();
    const len = this.r.readUint();
    const ofs = this.r.ofs;
    this.r.skip(len);
    const type = [
      SectionType.custom,
      SectionType.type,
      SectionType.import,
      SectionType.function,
      SectionType.table,
      SectionType.memory,
      SectionType.global,
      SectionType.export,
      SectionType.start,
      SectionType.element,
      SectionType.code,
      SectionType.data,
      SectionType.data_count,
    ][id];
    return { index, type, ofs, len };
  }

  read(): Module {
    this.readFileHeader();
    const sections = [];
    let index = 0;
    while (!this.r.done()) {
      sections.push(this.readSectionHeader(index++));
    }
    return new Module(this.view.buffer, sections);
  }
}

export function read(view: DataView): Module {
  return new Parser(view).read();
}

export function readTypeSection(r: Reader): FuncType[] {
  return r.vec(readFuncType);
}

export enum DescType {
  table = 'table',
  mem = 'mem',
  global = 'global',

  funcidx = 'funcidx',
  typeidx = 'typeidx',
  tableidx = 'tableidx',
  memidx = 'tableidx',
  globalidx = 'globalidx',
}
export interface DescIndex<T> {
  type: T;
  index: number;
}
export interface DescTable {
  type: DescType.table;
  table: TableType;
}
export interface DescMem {
  type: DescType.mem;
  limits: Limits;
}
export interface DescGlobal {
  type: DescType.global;
  globalType: GlobalType;
}

export function descToString(desc: Import['desc'] | Export['desc']): string {
  switch (desc.type) {
    case DescType.table:
      return `table ${desc.table}`;
    case DescType.mem:
      return `mem min=${desc.limits.minimum} max=${desc.limits.maximum ?? 'none'}`;
    case DescType.global:
      return `mem ${desc}`;
    default:
      return `${desc.type} index ${desc.index}`;
  }
}

export interface Import {
  module: string;
  name: string;
  desc: DescIndex<DescType.typeidx> | DescTable | DescMem | DescGlobal;
}
export function importToString(imp: Import): string {
  return `${imp.module}.${imp.name} (${descToString(imp.desc)})`;
}

export interface Limits {
  minimum: number;
  maximum?: number;
}
function readLimits(r: Reader): Limits {
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

export interface TableType {
  element: Type;
  limits: Limits;
}
function readTable(r: Reader): TableType {
  const element = readValType(r);
  const limits = readLimits(r);
  return { element, limits };
}

export interface GlobalType {
  valType: Type;
  mut: boolean;
}
function readGlobalType(r: Reader): GlobalType {
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

export function readImportSection(r: Reader): Import[] {
  return r.vec(() => {
    const module = r.name();
    const name = r.name();
    const desc8 = r.read8();
    let desc: Import['desc'];
    switch (desc8) {
      case 0:
        desc = { type: DescType.typeidx, index: r.readUint() };
        break;
      case 1:
        desc = { type: DescType.table, table: readTable(r) };
        break;
      case 2:
        desc = { type: DescType.mem, limits: readLimits(r) };
        break;
      case 3:
        desc = { type: DescType.global, globalType: readGlobalType(r) };
        break;
      default:
        throw new Error(`unhandled import desc type ${desc8.toString(16)}`);
    }
    return { module, name, desc };
  });
}

export interface Export {
  name: string;
  desc:
    | DescIndex<DescType.funcidx>
    | DescIndex<DescType.tableidx>
    | DescIndex<DescType.memidx>
    | DescIndex<DescType.globalidx>;
}
export function exportToString(exp: Export): string {
  return `${exp.name} (${descToString(exp.desc)})`;
}
export function readExportSection(r: Reader): Export[] {
  return r.vec(() => {
    const name = r.name();
    const desc8 = r.read8();
    let desc: Export['desc'];
    const type = (
      [
        DescType.funcidx,
        DescType.tableidx,
        DescType.memidx,
        DescType.globalidx,
      ] as const
    )[desc8];
    if (!type) {
      throw new Error(`unhandled export desc type ${desc8.toString(16)}`);
    }
    return { name, desc: { type, index: r.readUint() } };
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

export interface Global {
  type: GlobalType;
  init: code.Instruction[];
}
export function readGlobalSection(r: Reader): Global[] {
  return r.vec(() => {
    return { type: readGlobalType(r), init: code.readExpr(r) };
  });
}

export function readFunctionSection(r: Reader): number[] {
  return r.vec(() => r.readUint());
}

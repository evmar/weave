import { Reader } from './reader';
import { FuncType, readFuncType } from './type';

export { funcTypeToString } from './type';

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

  readSectionHeader(): SectionHeader {
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
    return { type, ofs, len };
  }

  read(): Module {
    this.readFileHeader();
    const sections = [];
    while (!this.r.done()) {
      sections.push(this.readSectionHeader());
    }
    return new Module(this.view.buffer, sections);
  }
}

export function read(view: DataView): Module {
  return new Parser(view).read();
}

export function readTypeSection(r: Reader): FuncType[] {
  return r.vec(() => readFuncType(r));
}

export enum IndexType {
  type = 'type',
  func = 'func',
  table = 'table',
  mem = 'mem',
  global = 'global',
}
export interface TypeIndex {
  type: IndexType.type;
  index: number;
}
export interface FuncIndex {
  type: IndexType.func;
  index: number;
}
export interface TableIndex {
  type: IndexType.table;
  index: number;
}
export interface MemIndex {
  type: IndexType.mem;
  index: number;
}
export interface GlobalIndex {
  type: IndexType.global;
  index: number;
}

export function indexToString(
  index: TypeIndex | FuncIndex | TableIndex | MemIndex | GlobalIndex
): string {
  switch (index.type) {
    case IndexType.type:
      return `func type ${index.index}`;
    case IndexType.func:
      return `function ${index.index}`;
    case IndexType.table:
      return `table ${index.index}`;
    case IndexType.mem:
      return `mem ${index.index}`;
    case IndexType.global:
      return `mem ${index.index}`;
  }
}

export interface Import {
  module: string;
  name: string;
  desc: TypeIndex | TableIndex | MemIndex | GlobalIndex;
}
export function importToString(imp: Import): string {
  return `${imp.module}.${imp.name} (${indexToString(imp.desc)})`;
}

export function readImportSection(r: Reader): Import[] {
  return r.vec(() => {
    const module = r.name();
    const name = r.name();
    const desc8 = r.read8();
    let type = (
      [
        IndexType.type,
        IndexType.table,
        IndexType.mem,
        IndexType.global,
      ] as const
    )[desc8];
    if (!type) {
      throw new Error(`unhandled export desc type ${desc8.toString(16)}`);
    }
    const desc = { type, index: r.readUint() };
    return { module, name, desc };
  });
}

export interface Export {
  name: string;
  desc: FuncIndex | TableIndex | MemIndex | GlobalIndex;
}
export function exportToString(exp: Export): string {
  return `${exp.name} (${indexToString(exp.desc)})`;
}
export function readExportSection(r: Reader): Export[] {
  return r.vec(() => {
    const name = r.name();
    const desc8 = r.read8();
    let type = (
      [
        IndexType.func,
        IndexType.table,
        IndexType.mem,
        IndexType.global,
      ] as const
    )[desc8];
    if (!type) {
      throw new Error(`unhandled export desc type ${desc8.toString(16)}`);
    }
    const desc = { type, index: r.readUint() };
    return { name, desc };
  });
}

export interface CustomSection {
  name: string;
  data: number;
}
export function readCustomSection(r: Reader): CustomSection {
  const name = r.name();
  const ofs = r.ofs;
  return { name, data: ofs };
}

export const x = 3;

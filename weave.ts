import * as fs from 'fs';
import * as code from './code';
import { Reader } from './reader';
import { FuncType, funcTypeToString, readFuncType } from './type';

enum SectionType {
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

interface SectionHeader {
  type: SectionType;
  ofs: number;
  len: number;
}

class Module {
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

  parse(): Module {
    this.readFileHeader();
    const sections = [];
    while (!this.r.done()) {
      sections.push(this.readSectionHeader());
    }
    return new Module(this.view.buffer, sections);
  }
}

export function parse(view: DataView): Module {
  return new Parser(view).parse();
}

export function parseTypeSection(r: Reader): FuncType[] {
  return r.vec(() => readFuncType(r));
}

enum IndexType {
  type = 'type',
  func = 'func',
  table = 'table',
  mem = 'mem',
  global = 'global',
}
interface TypeIndex {
  type: IndexType.type;
  index: number;
}
interface FuncIndex {
  type: IndexType.func;
  index: number;
}
interface TableIndex {
  type: IndexType.table;
  index: number;
}
interface MemIndex {
  type: IndexType.mem;
  index: number;
}
interface GlobalIndex {
  type: IndexType.global;
  index: number;
}

function indexToString(
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

interface Import {
  module: string;
  name: string;
  desc: TypeIndex | TableIndex | MemIndex | GlobalIndex;
}
export function importToString(imp: Import): string {
  return `${imp.module}.${imp.name} (${indexToString(imp.desc)})`;
}

export function parseImportSection(r: Reader): Import[] {
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

interface Export {
  name: string;
  desc: FuncIndex | TableIndex | MemIndex | GlobalIndex;
}
function exportToString(exp: Export): string {
  return `${exp.name} (${indexToString(exp.desc)})`;
}
export function parseExportSection(r: Reader): Export[] {
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

function main() {
  const file = fs.readFileSync('t.wasm');
  const buf = file.buffer.slice(
    file.byteOffset,
    file.byteOffset + file.byteLength
  );

  const module = parse(new DataView(buf));
  let funcIndex = 0;
  for (const sec of module.sections) {
    console.log(`# section: ${sec.type} (${sec.len} bytes)`);
    switch (sec.type) {
      case SectionType.type: {
        const types = parseTypeSection(module.getReader(sec));
        for (let i = 0; i < types.length; i++) {
          console.log(`  ${i}: ${funcTypeToString(types[i])}`);
        }
        break;
      }
      case SectionType.import:
        for (const imp of parseImportSection(module.getReader(sec))) {
          switch (imp.desc.type) {
            case IndexType.type:
              console.log(`  func ${funcIndex++}: ${importToString(imp)}`);
              break;
            default:
              console.log(`  ${importToString(imp)}`);
          }
        }
        break;
      case SectionType.export:
        for (const exp of parseExportSection(module.getReader(sec))) {
          console.log(`  ${exportToString(exp)}`);
        }
        break;
      case SectionType.code:
        for (const func of code.parse(module.getReader(sec))) {
          console.log(`  func ${funcIndex++}`);
          if (func.locals.length > 0) {
            console.log('    locals', func.locals);
          }
          code.print(func.body, 2);
        }
        break;
    }
  }
}
main();

import * as fs from 'fs';
import * as code from './code';
import { Reader } from './reader';

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

interface Section {
  type: SectionType;
  ofs: number;
  len: number;
}

class Parser {
  private r: Reader;
  constructor(view: DataView) {
    this.r = new Reader(view);
  }

  readHeader(): void {
    const magic = this.r.read32();
    if (magic !== 0x6d736100)
      throw new Error(`invalid signature: ${magic.toString(16)}`);
    const version = this.r.read32();
    if (version !== 1)
      throw new Error(`bad version, expected 1, got ${version}`);
  }

  readSection(): Section {
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

  parse(): Section[] {
    this.readHeader();
    const sections = [];
    while (!this.r.done()) {
      sections.push(this.readSection());
    }
    return sections;
  }
}

export function parse(view: DataView): Section[] {
  return new Parser(view).parse();
}

const file = fs.readFileSync('t.wasm');
const buf = file.buffer.slice(
  file.byteOffset,
  file.byteOffset + file.byteLength
);

const sections = parse(new DataView(buf));
for (const sec of sections) {
  console.log(sec);
  switch (sec.type) {
    case SectionType.code:
      for (const func of code.parse(new DataView(buf, sec.ofs, sec.len))) {
        console.log('func');
        if (func.locals.length > 0) {
          console.log('  locals', func.locals);
        }
        code.print(func.body, 1);
      }
      break;
  }
}

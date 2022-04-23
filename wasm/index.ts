export * from './sections';
export * from './shared';
export * from './type';
import { Reader } from './reader';
import { SectionType } from './sections';

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

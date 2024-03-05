export { Reader } from './reader';
export * from './sections';
export * from './shared';
export * from './type';
import { Reader } from './reader';
import { SectionKind } from './sections';

export interface SectionHeader {
  index: number;
  kind: SectionKind;
  ofs: number;
  len: number;
}

export function getSectionReader(
  buffer: ArrayBuffer,
  section: SectionHeader,
): Reader {
  return new Reader(new DataView(buffer, section.ofs, section.len));
}

function readFileHeader(r: Reader): void {
  const magic = r.read32();
  if (magic !== 0x6d736100) {
    throw new Error(`invalid signature: ${magic.toString(16)}`);
  }
  const version = r.read32();
  if (version !== 1) {
    throw new Error(`bad version, expected 1, got ${version}`);
  }
}

function readSectionHeader(r: Reader, index: number): SectionHeader {
  const id = r.read8();
  const len = r.readUint();
  const ofs = r.ofs;
  r.skip(len);
  const kind = [
    SectionKind.custom,
    SectionKind.type,
    SectionKind.import,
    SectionKind.function,
    SectionKind.table,
    SectionKind.memory,
    SectionKind.global,
    SectionKind.export,
    SectionKind.start,
    SectionKind.element,
    SectionKind.code,
    SectionKind.data,
    SectionKind.data_count,
  ][id];
  return { index, kind, ofs, len };
}

export function read(buffer: ArrayBuffer): SectionHeader[] {
  const r = new Reader(new DataView(buffer));
  readFileHeader(r);
  const sections = [];
  for (let index = 0; !r.done(); index++) {
    sections.push(readSectionHeader(r, index));
  }
  return sections;
}

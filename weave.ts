import * as fs from 'fs';
import * as code from './code';

export class Reader {
  view: DataView;
  ofs: number = 0;

  constructor(buf: ArrayBuffer) {
    this.view = new DataView(buf);
  }

  done(): boolean {
    return this.ofs == this.view.byteLength;
  }

  read8(): number {
    const val = this.view.getUint8(this.ofs);
    this.ofs += 1;
    return val;
  }
  back(): void {
    this.ofs -= 1;
  }

  read32(): number {
    const val = this.view.getUint32(this.ofs, true);
    this.ofs += 4;
    return val;
  }

  readUint(): number {
    let n = 0;
    let shift = 0;
    while (true) {
      const b = this.read8();
      n |= (b & 0x7f) << shift;
      if ((b & 0x80) === 0) break;
      shift += 7;
    }
    return n;
  }

  readF32(): number {
    const val = this.view.getFloat32(this.ofs, true);
    this.ofs += 4;
    return val;
  }

  readF64(): number {
    const val = this.view.getFloat64(this.ofs, true);
    this.ofs += 8;
    return val;
  }

  skip(len: number) {
    this.ofs += len;
  }
}

class Parser {
  constructor(private r: Reader) {}

  readHeader(): void {
    const magic = this.r.read32();
    if (magic !== 0x6d736100)
      throw new Error(`invalid signature: ${magic.toString(16)}`);
    const version = this.r.read32();
    if (version !== 1)
      throw new Error(`bad version, expected 1, got ${version}`);
  }

  readSection() {
    const id = this.r.read8();
    const len = this.r.readUint();
    switch (id) {
      case 10:
        for (const func of code.parse(this.r)) {
          console.log('func');
          if (func.locals.length > 0) {
            console.log('  locals', func.locals);
          }
          code.print(func.body, 1);
        }
        break;
      default:
        this.r.skip(len);
    }
    console.log(id, len);
  }

  read() {
    this.readHeader();
    while (!this.r.done()) {
      this.readSection();
    }
  }
}

const file = fs.readFileSync('t.wasm');
const buf = file.buffer.slice(
  file.byteOffset,
  file.byteOffset + file.byteLength
);
const r = new Parser(new Reader(buf));
r.read();

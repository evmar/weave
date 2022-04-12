/** Tracks a read position within a DataView. */
export class Reader {
  ofs: number = 0;

  constructor(private view: DataView) {}

  done(): boolean {
    return this.ofs == this.view.byteLength;
  }

  debug(): string {
    let out = `${this.view.byteLength - this.ofs} remaining:`;
    for (let i = 0; i < 16; i++) {
      out += ' ' + this.read8().toString(16);
    }
    return out;
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

  vec<T>(f: (r: Reader) => T): T[] {
    const len = this.readUint();
    const ts = new Array(len);
    for (let i = 0; i < len; i++) {
      ts[i] = f(this);
    }
    return ts;
  }

  name(): string {
    const len = this.readUint();
    const str = new TextDecoder().decode(
      new DataView(this.view.buffer, this.view.byteOffset + this.ofs, len)
    );
    this.ofs += len;
    return str;
  }
}

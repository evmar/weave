/** Tracks a read position within a DataView. */
export class Reader {
  ofs: number = 0;

  constructor(private view: DataView) {}

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

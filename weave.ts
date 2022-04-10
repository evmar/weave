import * as fs from 'fs';

class Reader {
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

enum Type {
  i32 = 'i32',
  i64 = 'i64',
  f32 = 'f32',
  f64 = 'f64',
  v128 = 'v128',
  funcref = 'funcref',
  externref = 'externref',
}

enum Instr {
  // control
  unreachable = 'unreachable',
  nop = 'nop',
  block = 'block',
  loop = 'loop',
  if = 'if',
  else = 'else',
  end = 'end',
  br = 'br',
  br_if = 'br_if',
  br_table = 'br_table',
  return = 'return',
  call = 'call',
  call_indirect = 'call_indirect',

  // variable
  local_get = 'local.get',
  local_set = 'local.set',
  local_tee = 'local.tee',
  global_get = 'global.get',
  global_set = 'global.set',

  // memory
  i32_load = 'i32.load',
  i64_load = 'i64.load',
  f32_load = 'f32.load',
  f64_load = 'f64.load',
  i32_load8_s = 'i32.load8_s',
  i32_load8_u = 'i32.load8_u',
  i32_load16_s = 'i32.load16_s',
  i32_load16_u = 'i32.load16_u',
  i64_load8_s = 'i64.load8_s',
  i64_load8_u = 'i64.load8_u',
  i64_load16_s = 'i64.load16_s',
  i64_load16_u = 'i64.load16_u',
  i64_load32_s = 'i64.load32_s',
  i64_load32_u = 'i64.load32_u',
  i32_store = 'i32.store',
  i64_store = 'i64.store',
  f32_store = 'f32.store',
  f64_store = 'f64.store',
  i32_store8 = 'i32.store8',
  i32_store16 = 'i32.store16',
  i64_store8 = 'i64.store8',
  i64_store16 = 'i64.store16',
  i64_store32 = 'i64.store32',

  // numeric
  // const
  i32_const = 'i32.const',
  i64_const = 'i64.const',
  f32_const = 'f32.const',
  f64_const = 'f64.const',
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

  readType() {
    const n = this.r.read8();
    switch (n) {
      case 0x7f:
        return Type.i32;
      case 0x7e:
        return Type.i64;
      case 0x7d:
        return Type.f32;
      case 0x7c:
        return Type.f64;
      case 0x7b:
        return Type.v128;
      case 0x70:
        return Type.funcref;
      case 0x6f:
        return Type.externref;
      default:
        throw new Error(`unknown type byte ${n.toString(16)}`);
    }
  }

  readBlockType() {
    const b = this.r.read8();
    if (b === 0x40) {
      return undefined;
    } else {
      throw new Error(
        'todo https://webassembly.github.io/spec/core/binary/instructions.html#binary-blocktype'
      );
    }
  }

  readMemArg(): { align: number; offset: number } {
    return { align: this.r.readUint(), offset: this.r.readUint() };
  }

  readInstr(): [Instr, unknown?] {
    const op = this.r.read8();
    let instr: Instr;
    let extra: unknown;
    switch (op) {
      case 0x00:
        instr = Instr.unreachable;
        break;
      case 0x01:
        instr = Instr.nop;
        break;
      case 0x02:
        instr = Instr.block;
        extra = this.readBlockType();
        break;
      case 0x03:
        instr = Instr.loop;
        extra = this.readBlockType();
        break;
      case 0x04:
        instr = Instr.if;
        extra = this.readBlockType();
        break;
      case 0x0b:
        instr = Instr.end;
        break;
      case 0x0c:
        instr = Instr.br;
        extra = this.r.readUint();
        break;
      case 0x0d:
        instr = Instr.br_if;
        extra = this.r.readUint();
        break;
      case 0x0e:
        instr = Instr.br_table;
        throw new Error('unimplemented');
        break;
      case 0x0f:
        instr = Instr.return;
        break;
      case 0x10:
        instr = Instr.call;
        extra = this.r.readUint();
        break;
      case 0x11:
        instr = Instr.call_indirect;
        extra = [this.r.readUint(), this.r.readUint()];
        break;

      case 0x20:
        instr = Instr.local_get;
        extra = this.r.readUint();
        break;
      case 0x21:
        instr = Instr.local_set;
        extra = this.r.readUint();
        break;
      case 0x22:
        instr = Instr.local_tee;
        extra = this.r.readUint();
        break;
      case 0x23:
        instr = Instr.global_get;
        extra = this.r.readUint();
        break;
      case 0x24:
        instr = Instr.global_set;
        extra = this.r.readUint();
        break;

      case 0x28:
        instr = Instr.i32_load;
        extra = this.readMemArg();
        break;
      case 0x29:
        instr = Instr.i64_load;
        extra = this.readMemArg();
        break;
      case 0x2a:
        instr = Instr.f32_load;
        extra = this.readMemArg();
        break;
      case 0x2b:
        instr = Instr.f64_load;
        extra = this.readMemArg();
        break;
      case 0x2c:
        instr = Instr.i32_load8_s;
        extra = this.readMemArg();
        break;
      case 0x2d:
        instr = Instr.i32_load8_u;
        extra = this.readMemArg();
        break;
      case 0x2e:
        instr = Instr.i32_load16_s;
        extra = this.readMemArg();
        break;
      case 0x2f:
        instr = Instr.i32_load16_u;
        extra = this.readMemArg();
        break;
      case 0x30:
        instr = Instr.i64_load8_s;
        extra = this.readMemArg();
        break;
      case 0x31:
        instr = Instr.i64_load8_u;
        extra = this.readMemArg();
        break;
      case 0x32:
        instr = Instr.i64_load16_s;
        extra = this.readMemArg();
        break;
      case 0x33:
        instr = Instr.i64_load16_u;
        extra = this.readMemArg();
        break;
      case 0x34:
        instr = Instr.i64_load32_s;
        extra = this.readMemArg();
        break;
      case 0x35:
        instr = Instr.i64_load32_u;
        extra = this.readMemArg();
        break;
      case 0x36:
        instr = Instr.i32_store;
        extra = this.readMemArg();
        break;
      case 0x37:
        instr = Instr.i64_store;
        extra = this.readMemArg();
        break;
      case 0x38:
        instr = Instr.f32_store;
        extra = this.readMemArg();
        break;
      case 0x39:
        instr = Instr.f64_store;
        extra = this.readMemArg();
        break;
      case 0x3a:
        instr = Instr.i32_store8;
        extra = this.readMemArg();
        break;
      case 0x3b:
        instr = Instr.i32_store16;
        extra = this.readMemArg();
        break;
      case 0x3c:
        instr = Instr.i64_store8;
        extra = this.readMemArg();
        break;
      case 0x3d:
        instr = Instr.i64_store16;
        extra = this.readMemArg();
        break;
      case 0x3e:
        instr = Instr.i64_store32;
        extra = this.readMemArg();
        break;

      case 0x41:
        instr = Instr.i32_const;
        extra = this.r.readUint();
        break;
      case 0x42:
        instr = Instr.i64_const;
        extra = this.r.readUint();
        break;
      case 0x43:
        instr = Instr.f32_const;
        extra = this.r.readF32();
        break;
      case 0x44:
        instr = Instr.f64_const;
        extra = this.r.readF64();
        break;
      default:
        throw new Error(`unhandled op ${op.toString(16)}`);
    }
    return [instr, extra];
  }

  readExpr() {
    const instrs = [];
    while (true) {
      const [instr, extra] = this.readInstr();
      console.log(instr, extra);
      if (instr === Instr.end) break;
      instrs.push(instr);
    }
    return instrs;
  }

  readFunc() {
    const locals: Type[] = [];
    const len = this.r.readUint();
    for (let i = 0; i < len; i++) {
      const count = this.r.readUint();
      const type = this.readType();
      for (let j = 0; j < count; j++) {
        locals.push(type);
      }
    }
    console.log('locals', locals);
    this.readExpr();
  }

  readCode() {
    const len = this.r.readUint();
    for (let i = 0; i < len; i++) {
      const size = this.r.readUint();
      this.readFunc();
    }
  }

  readSection() {
    const id = this.r.read8();
    const len = this.r.readUint();
    switch (id) {
      case 10:
        this.readCode();
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

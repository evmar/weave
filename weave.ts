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

  i32_eqz = 'i32.eqz',
  i32_eq = 'i32.eq',
  i32_ne = 'i32.ne',
  i32_lt_s = 'i32.lt_s',
  i32_lt_u = 'i32.lt_u',
  i32_gt_s = 'i32.gt_s',
  i32_gt_u = 'i32.gt_u',
  i32_le_s = 'i32.le_s',
  i32_le_u = 'i32.le_u',
  i32_ge_s = 'i32.ge_s',
  i32_ge_u = 'i32.ge_u',
  i64_eqz = 'i64.eqz',
  i64_eq = 'i64.eq',
  i64_ne = 'i64.ne',
  i64_lt_s = 'i64.lt_s',
  i64_lt_u = 'i64.lt_u',
  i64_gt_s = 'i64.gt_s',
  i64_gt_u = 'i64.gt_u',
  i64_le_s = 'i64.le_s',
  i64_le_u = 'i64.le_u',
  i64_ge_s = 'i64.ge_s',
  i64_ge_u = 'i64.ge_u',
  f32_eq = 'f32.eq',
  f32_ne = 'f32.ne',
  f32_lt = 'f32.lt',
  f32_gt = 'f32.gt',
  f32_le = 'f32.le',
  f32_ge = 'f32.ge',
  f64_eq = 'f64.eq',
  f64_ne = 'f64.ne',
  f64_lt = 'f64.lt',
  f64_gt = 'f64.gt',
  f64_le = 'f64.le',
  f64_ge = 'f64.ge',
  i32_clz = 'i32.clz',
  i32_ctz = 'i32.ctz',
  i32_popcnt = 'i32.popcnt',
  i32_add = 'i32.add',
  i32_sub = 'i32.sub',
  i32_mul = 'i32.mul',
  i32_div_s = 'i32.div_s',
  i32_div_u = 'i32.div_u',
  i32_rem_s = 'i32.rem_s',
  i32_rem_u = 'i32.rem_u',
  i32_and = 'i32.and',
  i32_or = 'i32.or',
  i32_xor = 'i32.xor',
  i32_shl = 'i32.shl',
  i32_shr_s = 'i32.shr_s',
  i32_shr_u = 'i32.shr_u',
  i32_rotl = 'i32.rotl',
  i32_rotr = 'i32.rotr',
  i64_clz = 'i64.clz',
  i64_ctz = 'i64.ctz',
  i64_popcnt = 'i64.popcnt',
  i64_add = 'i64.add',
  i64_sub = 'i64.sub',
  i64_mul = 'i64.mul',
  i64_div_s = 'i64.div_s',
  i64_div_u = 'i64.div_u',
  i64_rem_s = 'i64.rem_s',
  i64_rem_u = 'i64.rem_u',
  i64_and = 'i64.and',
  i64_or = 'i64.or',
  i64_xor = 'i64.xor',
  i64_shl = 'i64.shl',
  i64_shr_s = 'i64.shr_s',
  i64_shr_u = 'i64.shr_u',
  i64_rotl = 'i64.rotl',
  i64_rotr = 'i64.rotr',
  f32_abs = 'f32.abs',
  f32_neg = 'f32.neg',
  f32_ceil = 'f32.ceil',
  f32_floor = 'f32.floor',
  f32_trunc = 'f32.trunc',
  f32_nearest = 'f32.nearest',
  f32_sqrt = 'f32.sqrt',
  f32_add = 'f32.add',
  f32_sub = 'f32.sub',
  f32_mul = 'f32.mul',
  f32_div = 'f32.div',
  f32_min = 'f32.min',
  f32_max = 'f32.max',
  f32_copysign = 'f32.copysign',
  f64_abs = 'f64.abs',
  f64_neg = 'f64.neg',
  f64_ceil = 'f64.ceil',
  f64_floor = 'f64.floor',
  f64_trunc = 'f64.trunc',
  f64_nearest = 'f64.nearest',
  f64_sqrt = 'f64.sqrt',
  f64_add = 'f64.add',
  f64_sub = 'f64.sub',
  f64_mul = 'f64.mul',
  f64_div = 'f64.div',
  f64_min = 'f64.min',
  f64_max = 'f64.max',
  f64_copysign = 'f64.copysign',
  i32_wrap_i64 = 'i32.wrap_i64',
  i32_trunc_f32_s = 'i32.trunc_f32_s',
  i32_trunc_f32_u = 'i32.trunc_f32_u',
  i32_trunc_f64_s = 'i32.trunc_f64_s',
  i32_trunc_f64_u = 'i32.trunc_f64_u',
  i64_extend_i32_s = 'i64.extend_i32_s',
  i64_extend_i32_u = 'i64.extend_i32_u',
  i64_trunc_f32_s = 'i64.trunc_f32_s',
  i64_trunc_f32_u = 'i64.trunc_f32_u',
  i64_trunc_f64_s = 'i64.trunc_f64_s',
  i64_trunc_f64_u = 'i64.trunc_f64_u',
  f32_convert_i32_s = 'f32.convert_i32_s',
  f32_convert_i32_u = 'f32.convert_i32_u',
  f32_convert_i64_s = 'f32.convert_i64_s',
  f32_convert_i64_u = 'f32.convert_i64_u',
  f32_demote_f64 = 'f32.demote_f64',
  f64_convert_i32_s = 'f64.convert_i32_s',
  f64_convert_i32_u = 'f64.convert_i32_u',
  f64_convert_i64_s = 'f64.convert_i64_s',
  f64_convert_i64_u = 'f64.convert_i64_u',
  f64_promote_f32 = 'f64.promote_f32',
  i32_reinterpret_f32 = 'i32.reinterpret_f32',
  i64_reinterpret_f64 = 'i64.reinterpret_f64',
  f32_reinterpret_i32 = 'f32.reinterpret_i32',
  f64_reinterpret_i64 = 'f64.reinterpret_i64',
  i32_extend8_s = 'i32.extend8_s',
  i32_extend16_s = 'i32.extend16_s',
  i64_extend8_s = 'i64.extend8_s',
  i64_extend16_s = 'i64.extend16_s',
  i64_extend32_s = 'i64.extend32_s',
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
        this.readBlockType();
        extra = this.readExpr();
        break;
      case 0x03:
        instr = Instr.loop;
        this.readBlockType();
        extra = this.readExpr();
        break;
      case 0x04:
        instr = Instr.if;
        this.readBlockType();
        {
          let [instrs, end] = this.readInstrs();
          let elses = undefined;
          if (end === Instr.else) {
            elses = this.readExpr();
          }
          extra = [instrs, elses];
        }
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

      case 0x45:
        instr = Instr.i32_eqz;
        break;
      case 0x46:
        instr = Instr.i32_eq;
        break;
      case 0x47:
        instr = Instr.i32_ne;
        break;
      case 0x48:
        instr = Instr.i32_lt_s;
        break;
      case 0x49:
        instr = Instr.i32_lt_u;
        break;
      case 0x4a:
        instr = Instr.i32_gt_s;
        break;
      case 0x4b:
        instr = Instr.i32_gt_u;
        break;
      case 0x4c:
        instr = Instr.i32_le_s;
        break;
      case 0x4d:
        instr = Instr.i32_le_u;
        break;
      case 0x4e:
        instr = Instr.i32_ge_s;
        break;
      case 0x4f:
        instr = Instr.i32_ge_u;
        break;
      case 0x50:
        instr = Instr.i64_eqz;
        break;
      case 0x51:
        instr = Instr.i64_eq;
        break;
      case 0x52:
        instr = Instr.i64_ne;
        break;
      case 0x53:
        instr = Instr.i64_lt_s;
        break;
      case 0x54:
        instr = Instr.i64_lt_u;
        break;
      case 0x55:
        instr = Instr.i64_gt_s;
        break;
      case 0x56:
        instr = Instr.i64_gt_u;
        break;
      case 0x57:
        instr = Instr.i64_le_s;
        break;
      case 0x58:
        instr = Instr.i64_le_u;
        break;
      case 0x59:
        instr = Instr.i64_ge_s;
        break;
      case 0x5a:
        instr = Instr.i64_ge_u;
        break;
      case 0x5b:
        instr = Instr.f32_eq;
        break;
      case 0x5c:
        instr = Instr.f32_ne;
        break;
      case 0x5d:
        instr = Instr.f32_lt;
        break;
      case 0x5e:
        instr = Instr.f32_gt;
        break;
      case 0x5f:
        instr = Instr.f32_le;
        break;
      case 0x60:
        instr = Instr.f32_ge;
        break;
      case 0x61:
        instr = Instr.f64_eq;
        break;
      case 0x62:
        instr = Instr.f64_ne;
        break;
      case 0x63:
        instr = Instr.f64_lt;
        break;
      case 0x64:
        instr = Instr.f64_gt;
        break;
      case 0x65:
        instr = Instr.f64_le;
        break;
      case 0x66:
        instr = Instr.f64_ge;
        break;
      case 0x67:
        instr = Instr.i32_clz;
        break;
      case 0x68:
        instr = Instr.i32_ctz;
        break;
      case 0x69:
        instr = Instr.i32_popcnt;
        break;
      case 0x6a:
        instr = Instr.i32_add;
        break;
      case 0x6b:
        instr = Instr.i32_sub;
        break;
      case 0x6c:
        instr = Instr.i32_mul;
        break;
      case 0x6d:
        instr = Instr.i32_div_s;
        break;
      case 0x6e:
        instr = Instr.i32_div_u;
        break;
      case 0x6f:
        instr = Instr.i32_rem_s;
        break;
      case 0x70:
        instr = Instr.i32_rem_u;
        break;
      case 0x71:
        instr = Instr.i32_and;
        break;
      case 0x72:
        instr = Instr.i32_or;
        break;
      case 0x73:
        instr = Instr.i32_xor;
        break;
      case 0x74:
        instr = Instr.i32_shl;
        break;
      case 0x75:
        instr = Instr.i32_shr_s;
        break;
      case 0x76:
        instr = Instr.i32_shr_u;
        break;
      case 0x77:
        instr = Instr.i32_rotl;
        break;
      case 0x78:
        instr = Instr.i32_rotr;
        break;
      case 0x79:
        instr = Instr.i64_clz;
        break;
      case 0x7a:
        instr = Instr.i64_ctz;
        break;
      case 0x7b:
        instr = Instr.i64_popcnt;
        break;
      case 0x7c:
        instr = Instr.i64_add;
        break;
      case 0x7d:
        instr = Instr.i64_sub;
        break;
      case 0x7e:
        instr = Instr.i64_mul;
        break;
      case 0x7f:
        instr = Instr.i64_div_s;
        break;
      case 0x80:
        instr = Instr.i64_div_u;
        break;
      case 0x81:
        instr = Instr.i64_rem_s;
        break;
      case 0x82:
        instr = Instr.i64_rem_u;
        break;
      case 0x83:
        instr = Instr.i64_and;
        break;
      case 0x84:
        instr = Instr.i64_or;
        break;
      case 0x85:
        instr = Instr.i64_xor;
        break;
      case 0x86:
        instr = Instr.i64_shl;
        break;
      case 0x87:
        instr = Instr.i64_shr_s;
        break;
      case 0x88:
        instr = Instr.i64_shr_u;
        break;
      case 0x89:
        instr = Instr.i64_rotl;
        break;
      case 0x8a:
        instr = Instr.i64_rotr;
        break;
      case 0x8b:
        instr = Instr.f32_abs;
        break;
      case 0x8c:
        instr = Instr.f32_neg;
        break;
      case 0x8d:
        instr = Instr.f32_ceil;
        break;
      case 0x8e:
        instr = Instr.f32_floor;
        break;
      case 0x8f:
        instr = Instr.f32_trunc;
        break;
      case 0x90:
        instr = Instr.f32_nearest;
        break;
      case 0x91:
        instr = Instr.f32_sqrt;
        break;
      case 0x92:
        instr = Instr.f32_add;
        break;
      case 0x93:
        instr = Instr.f32_sub;
        break;
      case 0x94:
        instr = Instr.f32_mul;
        break;
      case 0x95:
        instr = Instr.f32_div;
        break;
      case 0x96:
        instr = Instr.f32_min;
        break;
      case 0x97:
        instr = Instr.f32_max;
        break;
      case 0x98:
        instr = Instr.f32_copysign;
        break;
      case 0x99:
        instr = Instr.f64_abs;
        break;
      case 0x9a:
        instr = Instr.f64_neg;
        break;
      case 0x9b:
        instr = Instr.f64_ceil;
        break;
      case 0x9c:
        instr = Instr.f64_floor;
        break;
      case 0x9d:
        instr = Instr.f64_trunc;
        break;
      case 0x9e:
        instr = Instr.f64_nearest;
        break;
      case 0x9f:
        instr = Instr.f64_sqrt;
        break;
      case 0xa0:
        instr = Instr.f64_add;
        break;
      case 0xa1:
        instr = Instr.f64_sub;
        break;
      case 0xa2:
        instr = Instr.f64_mul;
        break;
      case 0xa3:
        instr = Instr.f64_div;
        break;
      case 0xa4:
        instr = Instr.f64_min;
        break;
      case 0xa5:
        instr = Instr.f64_max;
        break;
      case 0xa6:
        instr = Instr.f64_copysign;
        break;
      case 0xa7:
        instr = Instr.i32_wrap_i64;
        break;
      case 0xa8:
        instr = Instr.i32_trunc_f32_s;
        break;
      case 0xa9:
        instr = Instr.i32_trunc_f32_u;
        break;
      case 0xaa:
        instr = Instr.i32_trunc_f64_s;
        break;
      case 0xab:
        instr = Instr.i32_trunc_f64_u;
        break;
      case 0xac:
        instr = Instr.i64_extend_i32_s;
        break;
      case 0xad:
        instr = Instr.i64_extend_i32_u;
        break;
      case 0xae:
        instr = Instr.i64_trunc_f32_s;
        break;
      case 0xaf:
        instr = Instr.i64_trunc_f32_u;
        break;
      case 0xb0:
        instr = Instr.i64_trunc_f64_s;
        break;
      case 0xb1:
        instr = Instr.i64_trunc_f64_u;
        break;
      case 0xb2:
        instr = Instr.f32_convert_i32_s;
        break;
      case 0xb3:
        instr = Instr.f32_convert_i32_u;
        break;
      case 0xb4:
        instr = Instr.f32_convert_i64_s;
        break;
      case 0xb5:
        instr = Instr.f32_convert_i64_u;
        break;
      case 0xb6:
        instr = Instr.f32_demote_f64;
        break;
      case 0xb7:
        instr = Instr.f64_convert_i32_s;
        break;
      case 0xb8:
        instr = Instr.f64_convert_i32_u;
        break;
      case 0xb9:
        instr = Instr.f64_convert_i64_s;
        break;
      case 0xba:
        instr = Instr.f64_convert_i64_u;
        break;
      case 0xbb:
        instr = Instr.f64_promote_f32;
        break;
      case 0xbc:
        instr = Instr.i32_reinterpret_f32;
        break;
      case 0xbd:
        instr = Instr.i64_reinterpret_f64;
        break;
      case 0xbe:
        instr = Instr.f32_reinterpret_i32;
        break;
      case 0xbf:
        instr = Instr.f64_reinterpret_i64;
        break;
      case 0xc0:
        instr = Instr.i32_extend8_s;
        break;
      case 0xc1:
        instr = Instr.i32_extend16_s;
        break;
      case 0xc2:
        instr = Instr.i64_extend8_s;
        break;
      case 0xc3:
        instr = Instr.i64_extend16_s;
        break;
      case 0xc4:
        instr = Instr.i64_extend32_s;
        break;

      default:
        throw new Error(`unhandled op ${op.toString(16)}`);
    }
    return [instr, extra];
  }

  readInstrs(): [Array<[Instr, unknown]>, Instr] {
    const instrs: Array<[Instr, unknown]> = [];
    while (true) {
      const [instr, extra] = this.readInstr();
      console.log(instr, extra);
      if (instr === Instr.end || instr === Instr.else) {
        return [instrs, instr];
      }
      instrs.push([instr, extra]);
    }
  }

  readExpr() {
    return this.readInstrs()[0];
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

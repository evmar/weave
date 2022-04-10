/** Wasm-level types (e.g. function type, valtype). */

import { Reader } from "./reader";

export enum Type {
  i32 = 'i32',
  i64 = 'i64',
  f32 = 'f32',
  f64 = 'f64',
  v128 = 'v128',
  funcref = 'funcref',
  externref = 'externref',
}

export function readValType(r: Reader) {
  const n = r.read8();
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

export interface FuncType {
  params: Type[];
  result: Type[];
}

export function readFuncType(r: Reader): FuncType {
  const params = r.vec(() => readValType(r));
  const result = r.vec(() => readValType(r));
  return {params, result};
}
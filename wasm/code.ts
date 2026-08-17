/**
 * 'code' sections (functions and wasm instructions) parsing and printing.
 */

import { Reader } from './reader';
import { readValType, Type } from './type';

// https://webassembly.github.io/spec/core/binary/instructions.html
// note: order of these matches the Binary section of spec,
// which is a different order from the Structure section.
export enum Instr {
  // parametric
  unreachable = 'unreachable',
  nop = 'nop',
  drop = 'drop',
  select = 'select',

  // control
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

  // table
  table_get = 'table.get',
  table_set = 'table.set',
  table_init = 'table.init',
  elem_drop = 'elem.drop',
  table_copy = 'table.copy',
  table_grow = 'table.grow',
  table_size = 'table.size',
  table_fill = 'table.fill',

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

  memory_size = 'memory.size',
  memory_grow = 'memory.grow',
  memory_fill = 'memory.fill',
  memory_copy = 'memory.copy',
  memory_init = 'memory.init',
  data_drop = 'data.drop',

  // reference
  ref_null = 'ref.null',
  ref_is_null = 'ref.is_null',
  ref_func = 'ref.func',

  // aggregate
  // TODO

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

  // saturating truncation
  i32_trunc_sat_s_f32 = 'i32.trunc_sat_s_f32',
  i32_trunc_sat_u_f32 = 'i32.trunc_sat_u_f32',
  i32_trunc_sat_s_f64 = 'i32.trunc_sat_s_f64',
  i32_trunc_sat_u_f64 = 'i32.trunc_sat_u_f64',
  i64_trunc_sat_s_f32 = 'i64.trunc_sat_s_f32',
  i64_trunc_sat_u_f32 = 'i64.trunc_sat_u_f32',
  i64_trunc_sat_s_f64 = 'i64.trunc_sat_s_f64',
  i64_trunc_sat_u_f64 = 'i64.trunc_sat_u_f64',

  // vector instructions
  v128_load = 'v128.load',
  v128_load8x8_s = 'v128.load8x8_s',
  v128_load8x8_u = 'v128.load8x8_u',
  v128_load16x4_s = 'v128.load16x4_s',
  v128_load16x4_u = 'v128.load16x4_u',
  v128_load32x2_s = 'v128.load32x2_s',
  v128_load32x2_u = 'v128.load32x2_u',
  v128_load8_splat = 'v128.load8_splat',
  v128_load16_splat = 'v128.load16_splat',
  v128_load32_splat = 'v128.load32_splat',
  v128_load64_splat = 'v128.load64_splat',
  v128_store = 'v128.store',
  v128_load8_lane = 'v128.load8_lane',
  v128_load16_lane = 'v128.load16_lane',
  v128_load32_lane = 'v128.load32_lane',
  v128_load64_lane = 'v128.load64_lane',
  v128_store8_lane = 'v128.store8_lane',
  v128_store16_lane = 'v128.store16_lane',
  v128_store32_lane = 'v128.store32_lane',
  v128_store64_lane = 'v128.store64_lane',
  v128_load32_zero = 'v128.load32_zero',
  v128_load64_zero = 'v128.load64_zero',

  v128_const = 'v128.const',

  i8x16_shuffle = 'i8x16.shuffle',
  i8x16_swizzle = 'i8x16.swizzle',
  i8x16_relaxed_swizzle = 'i8x16.relaxed_swizzle',

  i8x16_extract_lane_s = 'i8x16.extract_lane_s',
  i8x16_extract_lane_u = 'i8x16.extract_lane_u',
  i8x16_replace_lane = 'i8x16.replace_lane',
  i16x8_extract_lane_s = 'i16x8.extract_lane_s',
  i16x8_extract_lane_u = 'i16x8.extract_lane_u',
  i16x8_replace_lane = 'i16x8.replace_lane',
  i32x4_extract_lane = 'i32x4.extract_lane',
  i32x4_replace_lane = 'i32x4.replace_lane',
  i64x2_extract_lane = 'i64x2.extract_lane',
  i64x2_replace_lane = 'i64x2.replace_lane',
  f32x4_extract_lane = 'f32x4.extract_lane',
  f32x4_replace_lane = 'f32x4.replace_lane',
  f64x2_extract_lane = 'f64x2.extract_lane',
  f64x2_replace_lane = 'f64x2.replace_lane',

  i8x16_splat = 'i8x16.splat',
  i16x8_splat = 'i16x8.splat',
  i32x4_splat = 'i32x4.splat',
  i64x2_splat = 'i64x2.splat',
  f32x4_splat = 'f32x4.splat',
  f64x2_splat = 'f64x2.splat',

  i8x16_eq = 'i8x16.eq',
  i8x16_ne = 'i8x16.ne',
  i8x16_lt_s = 'i8x16.lt_s',
  i8x16_lt_u = 'i8x16.lt_u',
  i8x16_gt_s = 'i8x16.gt_s',
  i8x16_gt_u = 'i8x16.gt_u',
  i8x16_le_s = 'i8x16.le_s',
  i8x16_le_u = 'i8x16.le_u',
  i8x16_ge_s = 'i8x16.ge_s',
  i8x16_ge_u = 'i8x16.ge_u',
  i16x8_eq = 'i16x8.eq',
  i16x8_ne = 'i16x8.ne',
  i16x8_lt_s = 'i16x8.lt_s',
  i16x8_lt_u = 'i16x8.lt_u',
  i16x8_gt_s = 'i16x8.gt_s',
  i16x8_gt_u = 'i16x8.gt_u',
  i16x8_le_s = 'i16x8.le_s',
  i16x8_le_u = 'i16x8.le_u',
  i16x8_ge_s = 'i16x8.ge_s',
  i16x8_ge_u = 'i16x8.ge_u',
  i32x4_eq = 'i32x4.eq',
  i32x4_ne = 'i32x4.ne',
  i32x4_lt_s = 'i32x4.lt_s',
  i32x4_lt_u = 'i32x4.lt_u',
  i32x4_gt_s = 'i32x4.gt_s',
  i32x4_gt_u = 'i32x4.gt_u',
  i32x4_le_s = 'i32x4.le_s',
  i32x4_le_u = 'i32x4.le_u',
  i32x4_ge_s = 'i32x4.ge_s',
  i32x4_ge_u = 'i32x4.ge_u',
  i64x2_eq = 'i64x2.eq',
  i64x2_ne = 'i64x2.ne',
  i64x2_lt_s = 'i64x2.lt_s',
  i64x2_gt_s = 'i64x2.gt_s',
  i64x2_le_s = 'i64x2.le_s',
  i64x2_ge_s = 'i64x2.ge_s',

  f32x4_eq = 'f32x4.eq',
  f32x4_ne = 'f32x4.ne',
  f32x4_lt = 'f32x4.lt',
  f32x4_gt = 'f32x4.gt',
  f32x4_le = 'f32x4.le',
  f32x4_ge = 'f32x4.ge',
  f64x2_eq = 'f64x2.eq',
  f64x2_ne = 'f64x2.ne',
  f64x2_lt = 'f64x2.lt',
  f64x2_gt = 'f64x2.gt',
  f64x2_le = 'f64x2.le',
  f64x2_ge = 'f64x2.ge',

  v128_not = 'v128.not',
  v128_and = 'v128.and',
  v128_andnot = 'v128.andnot',
  v128_or = 'v128.or',
  v128_xor = 'v128.xor',
  v128_bitselect = 'v128.bitselect',
  v128_any_true = 'v128.any_true',

  i8x16_abs = 'i8x16.abs',
  i8x16_neg = 'i8x16.neg',
  i8x16_popcnt = 'i8x16.popcnt',
  i8x16_all_true = 'i8x16.all_true',
  i8x16_bitmask = 'i8x16.bitmask',
  i8x16_narrow_i16x8_s = 'i8x16.narrow_i16x8_s',
  i8x16_narrow_i16x8_u = 'i8x16.narrow_i16x8_u',
  i8x16_shl = 'i8x16.shl',
  i8x16_shr_s = 'i8x16.shr_s',
  i8x16_shr_u = 'i8x16.shr_u',
  i8x16_add = 'i8x16.add',
  i8x16_add_sat_s = 'i8x16.add_sat_s',
  i8x16_add_sat_u = 'i8x16.add_sat_u',
  i8x16_sub = 'i8x16.sub',
  i8x16_sub_sat_s = 'i8x16.sub_sat_s',
  i8x16_sub_sat_u = 'i8x16.sub_sat_u',
  i8x16_min_s = 'i8x16.min_s',
  i8x16_min_u = 'i8x16.min_u',
  i8x16_max_s = 'i8x16.max_s',
  i8x16_max_u = 'i8x16.max_u',
  i8x16_avgr_u = 'i8x16.avgr_u',

  i16x8_extadd_pairwise_s_i8x16 = 'i16x8.extadd_pairwise_s_i8x16',
  i16x8_extadd_pairwise_u_i8x16 = 'i16x8.extadd_pairwise_u_i8x16',
  i16x8_abs = 'i16x8.abs',
  i16x8_neg = 'i16x8.neg',
  i16x8_all_true = 'i16x8.all_true',
  i16x8_bitmask = 'i16x8.bitmask',
  i16x8_narrow_i32x4_s = 'i16x8.narrow_i32x4_s',
  i16x8_narrow_i32x4_u = 'i16x8.narrow_i32x4_u',
  i16x8_extend_low_s_i8x16 = 'i16x8.extend_low_s_i8x16',
  i16x8_extend_high_s_i8x16 = 'i16x8.extend_high_s_i8x16',
  i16x8_extend_low_u_i8x16 = 'i16x8.extend_low_u_i8x16',
  i16x8_extend_high_u_i8x16 = 'i16x8.extend_high_u_i8x16',
  i16x8_shl = 'i16x8.shl',
  i16x8_shr_s = 'i16x8.shr_s',
  i16x8_shr_u = 'i16x8.shr_u',
  i16x8_q15mulr_sat_s = 'i16x8.q15mulr_sat_s',
  i16x8_add = 'i16x8.add',
  i16x8_add_sat_s = 'i16x8.add_sat_s',
  i16x8_add_sat_u = 'i16x8.add_sat_u',
  i16x8_sub = 'i16x8.sub',
  i16x8_sub_sat_s = 'i16x8.sub_sat_s',
  i16x8_sub_sat_u = 'i16x8.sub_sat_u',
  i16x8_mul = 'i16x8.mul',
  i16x8_min_s = 'i16x8.min_s',
  i16x8_min_u = 'i16x8.min_u',
  i16x8_max_s = 'i16x8.max_s',
  i16x8_max_u = 'i16x8.max_u',
  i16x8_avgr_u = 'i16x8.avgr_u',
  i16x8_relaxed_q15mulr_s = 'i16x8.relaxed_q15mulr_s',
  i16x8_extmul_low_s_i8x16 = 'i16x8.extmul_low_s_i8x16',
  i16x8_extmul_high_s_i8x16 = 'i16x8.extmul_high_s_i8x16',
  i16x8_extmul_low_u_i8x16 = 'i16x8.extmul_low_u_i8x16',
  i16x8_extmul_high_u_i8x16 = 'i16x8.extmul_high_u_i8x16',
  i16x8_relaxed_dot_s_i8x16 = 'i16x8.relaxed_dot_s_i8x16',

  i32x4_extadd_pairwise_s_i16x8 = 'i32x4.extadd_pairwise_s_i16x8',
  i32x4_extadd_pairwise_u_i16x8 = 'i32x4.extadd_pairwise_u_i16x8',
  i32x4_abs = 'i32x4.abs',
  i32x4_neg = 'i32x4.neg',
  i32x4_all_true = 'i32x4.all_true',
  i32x4_bitmask = 'i32x4.bitmask',
  i32x4_extend_low_s_i16x8 = 'i32x4.extend_low_s_i16x8',
  i32x4_extend_high_s_i16x8 = 'i32x4.extend_high_s_i16x8',
  i32x4_extend_low_u_i16x8 = 'i32x4.extend_low_u_i16x8',
  i32x4_extend_high_u_i16x8 = 'i32x4.extend_high_u_i16x8',
  i32x4_shl = 'i32x4.shl',
  i32x4_shr_s = 'i32x4.shr_s',
  i32x4_shr_u = 'i32x4.shr_u',
  i32x4_add = 'i32x4.add',
  i32x4_sub = 'i32x4.sub',
  i32x4_mul = 'i32x4.mul',
  i32x4_min_s = 'i32x4.min_s',
  i32x4_min_u = 'i32x4.min_u',
  i32x4_max_s = 'i32x4.max_s',
  i32x4_max_u = 'i32x4.max_u',
  i32x4_dot_s_i16x8 = 'i32x4.dot_s_i16x8',
  i32x4_extmul_low_s_i16x8 = 'i32x4.extmul_low_s_i16x8',
  i32x4_extmul_high_s_i16x8 = 'i32x4.extmul_high_s_i16x8',
  i32x4_extmul_low_u_i16x8 = 'i32x4.extmul_low_u_i16x8',
  i32x4_extmul_high_u_i16x8 = 'i32x4.extmul_high_u_i16x8',
  i32x4_relaxed_dot_add_s_i16x8 = 'i32x4.relaxed_dot_add_s_i16x8',

  i64x2_abs = 'i64x2.abs',
  i64x2_neg = 'i64x2.neg',
  i64x2_all_true = 'i64x2.all_true',
  i64x2_bitmask = 'i64x2.bitmask',
  i64x2_extend_low_s_i32x4 = 'i64x2.extend_low_s_i32x4',
  i64x2_extend_high_s_i32x4 = 'i64x2.extend_high_s_i32x4',
  i64x2_extend_low_u_i32x4 = 'i64x2.extend_low_u_i32x4',
  i64x2_extend_high_u_i32x4 = 'i64x2.extend_high_u_i32x4',
  i64x2_shl = 'i64x2.shl',
  i64x2_shr_s = 'i64x2.shr_s',
  i64x2_shr_u = 'i64x2.shr_u',
  i64x2_add = 'i64x2.add',
  i64x2_sub = 'i64x2.sub',
  i64x2_mul = 'i64x2.mul',
  i64x2_extmul_low_s_i32x4 = 'i64x2.extmul_low_s_i32x4',
  i64x2_extmul_high_s_i32x4 = 'i64x2.extmul_high_s_i32x4',
  i64x2_extmul_low_u_i32x4 = 'i64x2.extmul_low_u_i32x4',
  i64x2_extmul_high_u_i32x4 = 'i64x2.extmul_high_u_i32x4',

  f32x4_ceil = 'f32x4.ceil',
  f32x4_floor = 'f32x4.floor',
  f32x4_trunc = 'f32x4.trunc',
  f32x4_nearest = 'f32x4.nearest',
  f32x4_abs = 'f32x4.abs',
  f32x4_neg = 'f32x4.neg',
  f32x4_sqrt = 'f32x4.sqrt',
  f32x4_add = 'f32x4.add',
  f32x4_sub = 'f32x4.sub',
  f32x4_mul = 'f32x4.mul',
  f32x4_div = 'f32x4.div',
  f32x4_min = 'f32x4.min',
  f32x4_max = 'f32x4.max',
  f32x4_pmin = 'f32x4.pmin',
  f32x4_pmax = 'f32x4.pmax',
  f32x4_relaxed_min = 'f32x4.relaxed_min',
  f32x4_relaxed_max = 'f32x4.relaxed_max',
  f32x4_relaxed_madd = 'f32x4.relaxed_madd',
  f32x4_relaxed_nmadd = 'f32x4.relaxed_nmadd',

  f64x2_ceil = 'f64x2.ceil',
  f64x2_floor = 'f64x2.floor',
  f64x2_trunc = 'f64x2.trunc',
  f64x2_nearest = 'f64x2.nearest',
  f64x2_abs = 'f64x2.abs',
  f64x2_neg = 'f64x2.neg',
  f64x2_sqrt = 'f64x2.sqrt',
  f64x2_add = 'f64x2.add',
  f64x2_sub = 'f64x2.sub',
  f64x2_mul = 'f64x2.mul',
  f64x2_div = 'f64x2.div',
  f64x2_min = 'f64x2.min',
  f64x2_max = 'f64x2.max',
  f64x2_pmin = 'f64x2.pmin',
  f64x2_pmax = 'f64x2.pmax',
  f64x2_relaxed_min = 'f64x2.relaxed_min',
  f64x2_relaxed_max = 'f64x2.relaxed_max',
  f64x2_relaxed_madd = 'f64x2.relaxed_madd',
  f64x2_relaxed_nmadd = 'f64x2.relaxed_nmadd',
  i8x16_relaxed_laneselect = 'i8x16.relaxed_laneselect',
  i16x8_relaxed_laneselect = 'i16x8.relaxed_laneselect',
  i32x4_relaxed_laneselect = 'i32x4.relaxed_laneselect',
  i64x2_relaxed_laneselect = 'i64x2.relaxed_laneselect',

  f32x4_demote_zero_f64x2 = 'f32x4.demote_zero_f64x2',
  f64x2_promote_low_f32x4 = 'f64x2.promote_low_f32x4',
  i32x4_trunc_sat_s_f32x4 = 'i32x4.trunc_sat_s_f32x4',
  i32x4_trunc_sat_u_f32x4 = 'i32x4.trunc_sat_u_f32x4',
  f32x4_convert_s_i32x4 = 'f32x4.convert_s_i32x4',
  f32x4_convert_u_i32x4 = 'f32x4.convert_u_i32x4',
  i32x4_trunc_sat_s_zero_f64x2 = 'i32x4.trunc_sat_s_zero_f64x2',
  i32x4_trunc_sat_u_zero_f64x2 = 'i32x4.trunc_sat_u_zero_f64x2',
  f64x2_convert_low_s_i32x4 = 'f64x2.convert_low_s_i32x4',
  f64x2_convert_low_u_i32x4 = 'f64x2.convert_low_u_i32x4',
  i32x4_relaxed_trunc_s_f32x4 = 'i32x4.relaxed_trunc_s_f32x4',
  i32x4_relaxed_trunc_u_f32x4 = 'i32x4.relaxed_trunc_u_f32x4',
  i32x4_relaxed_trunc_s_zero_f64x2 = 'i32x4.relaxed_trunc_s_zero_f64x2',
  i32x4_relaxed_trunc_u_zero_f64x2 = 'i32x4.relaxed_trunc_u_zero_f64x2',
}

interface InstrBlock {
  op: Instr.block | Instr.loop;
  body: Instruction[];
}
interface InstrIf {
  op: Instr.if;
  body: Instruction[];
  else?: Instruction[];
}
interface InstrBranch {
  op: Instr.br | Instr.br_if;
  label: number;
}
interface InstrBranchTable {
  op: Instr.br_table;
  labels: number[];
  default: number;
}
interface InstrCall {
  op: Instr.call;
  func: number;
}
interface InstrCallIndirect {
  op: Instr.call_indirect;
  type: number;
  table: number;
}
interface InstrSelect {
  op: Instr.select;
  types?: Type[];
}
interface InstrLocal {
  op: Instr.local_get | Instr.local_set | Instr.local_tee;
  local: number;
}
interface InstrGlobal {
  op: Instr.global_get | Instr.global_set;
  global: number;
}
interface InstrMemArg {
  op:
    | Instr.i32_load
    | Instr.i64_load
    | Instr.f32_load
    | Instr.f64_load
    | Instr.i32_load8_s
    | Instr.i32_load8_u
    | Instr.i32_load16_s
    | Instr.i32_load16_u
    | Instr.i64_load8_s
    | Instr.i64_load8_u
    | Instr.i64_load16_s
    | Instr.i64_load16_u
    | Instr.i64_load32_s
    | Instr.i64_load32_u
    | Instr.i32_store
    | Instr.i64_store
    | Instr.f32_store
    | Instr.f64_store
    | Instr.i32_store8
    | Instr.i32_store16
    | Instr.i64_store8
    | Instr.i64_store16
    | Instr.i64_store32;
  memarg: MemArg;
}
interface InstrMemIdx {
  op: Instr.memory_size | Instr.memory_grow | Instr.memory_fill;
  mem: number;
}
interface InstrMemInit {
  op: Instr.memory_init;
  data: number;
  mem: number;
}
interface InstrDataDrop {
  op: Instr.data_drop;
  data: number;
}
interface InstrMemCopy {
  op: Instr.memory_copy;
  srcMem: number;
  dstMem: number;
}
type InstrMem = InstrMemArg | InstrMemIdx | InstrMemInit | InstrDataDrop | InstrMemCopy;
interface InstrConstInt32 {
  op: Instr.i32_const;
  n: number;
}
interface InstrConstInt64 {
  op: Instr.i64_const;
  n: bigint;
}
interface InstrConstFloat {
  op: Instr.f32_const | Instr.f64_const;
  z: number;
}
interface InstrRefNull {
  op: Instr.ref_null;
  type: Type;
}
interface InstrRefFunc {
  op: Instr.ref_func;
  index: number;
}
interface InstrTable {
  op: Instr.table_get | Instr.table_set | Instr.table_grow | Instr.table_size | Instr.table_fill;
  index: number;
}
interface InstrVecMem {
  op:
    | Instr.v128_load
    | Instr.v128_load8x8_s
    | Instr.v128_load8x8_u
    | Instr.v128_load16x4_s
    | Instr.v128_load16x4_u
    | Instr.v128_load32x2_s
    | Instr.v128_load32x2_u
    | Instr.v128_load8_splat
    | Instr.v128_load16_splat
    | Instr.v128_load32_splat
    | Instr.v128_load64_splat
    | Instr.v128_store
    | Instr.v128_load32_zero
    | Instr.v128_load64_zero;
  memarg: MemArg;
}
interface InstrVecMemLane {
  op:
    | Instr.v128_load8_lane
    | Instr.v128_load16_lane
    | Instr.v128_load32_lane
    | Instr.v128_load64_lane
    | Instr.v128_store8_lane
    | Instr.v128_store16_lane
    | Instr.v128_store32_lane
    | Instr.v128_store64_lane;
  memarg: MemArg;
  lane: number;
}
interface InstrVecConst {
  op: Instr.v128_const;
  bytes: DataView;
}
interface InstrVecShuffle {
  op: Instr.i8x16_shuffle;
  lanes: number[];
}
interface InstrVecLane {
  op:
    | Instr.i8x16_extract_lane_s
    | Instr.i8x16_extract_lane_u
    | Instr.i8x16_replace_lane
    | Instr.i16x8_extract_lane_s
    | Instr.i16x8_extract_lane_u
    | Instr.i16x8_replace_lane
    | Instr.i32x4_extract_lane
    | Instr.i32x4_replace_lane
    | Instr.i64x2_extract_lane
    | Instr.i64x2_replace_lane
    | Instr.f32x4_extract_lane
    | Instr.f32x4_replace_lane
    | Instr.f64x2_extract_lane
    | Instr.f64x2_replace_lane;
  lane: number;
}
type InstrVec = InstrVecMem | InstrVecMemLane | InstrVecConst | InstrVecShuffle | InstrVecLane;
type InstructionWithFields =
  | InstrBlock
  | InstrIf
  | InstrBranch
  | InstrBranchTable
  | InstrCall
  | InstrCallIndirect
  | InstrSelect
  | InstrLocal
  | InstrGlobal
  | InstrMem
  | InstrConstInt32
  | InstrConstInt64
  | InstrConstFloat
  | InstrRefNull
  | InstrRefFunc
  | InstrTable
  | InstrVec;

// All other instructions that weren't specially typed above hold just an op.
// Use a little TypeScript magic so we get a fully discriminated union.
interface InstructionWithoutFields {
  op: Exclude<Instr, InstructionWithFields['op']>;
}
export type Instruction = InstructionWithoutFields | InstructionWithFields;

export interface FunctionHeader {
  ofs: number;
  len: number;
}

export interface Function {
  locals: Type[];
  body: Instruction[];
}

function readBlockType(r: Reader) {
  const b = r.read8();
  if (b === 0x40) {
    return undefined;
  }
  r.back();
  return readValType(r);
  // todo https://webassembly.github.io/spec/core/binary/instructions.html#binary-blocktype
}

interface MemArg {
  align: number;
  index: number;
  offset: number;
}
function readMemArg(r: Reader): MemArg {
  let align = r.readUint();
  let index = 0;
  if (align & 0b0100_0000) {
    index = r.readUint();
    align = align & ~0b0100_0000;
  }
  if (align & 0b1000_0000) {
    throw new Error(`bad memarg align ${align.toString(16)}`);
  }
  const offset = r.readUint();
  return { align, index, offset };
}

function readInstruction(r: Reader): Instruction {
  const op = r.read8();
  switch (op) {
    case 0x00:
      return { op: Instr.unreachable };
    case 0x01:
      return { op: Instr.nop };
    case 0x02:
      readBlockType(r);
      return { op: Instr.block, body: readExpr(r) };
    case 0x03:
      readBlockType(r);
      return { op: Instr.loop, body: readExpr(r) };
    case 0x04:
      readBlockType(r);
      {
        let [body, end] = readInstrs(r);
        let instr: InstrIf = { op: Instr.if, body };
        if (end === Instr.else) {
          instr.else = readExpr(r);
        }
        return instr;
      }
    case 0x05:
      return { op: Instr.else };
    case 0x0b:
      return { op: Instr.end };
    case 0x0c:
      return { op: Instr.br, label: r.readUint() };
    case 0x0d:
      return { op: Instr.br_if, label: r.readUint() };
    case 0x0e:
      return {
        op: Instr.br_table,
        labels: r.vec(() => r.readUint()),
        default: r.readUint(),
      };
    case 0x0f:
      return { op: Instr.return };
    case 0x10:
      return { op: Instr.call, func: r.readUint() };
    case 0x11:
      return {
        op: Instr.call_indirect,
        type: r.readUint(),
        table: r.readUint(),
      };

    case 0x1a:
      return { op: Instr.drop };
    case 0x1b:
      return { op: Instr.select };
    case 0x1c: {
      const types = r.vec(readValType);
      return { op: Instr.select, types };
    }

    case 0x20:
      return { op: Instr.local_get, local: r.readUint() };
    case 0x21:
      return { op: Instr.local_set, local: r.readUint() };
    case 0x22:
      return { op: Instr.local_tee, local: r.readUint() };
    case 0x23:
      return {
        op: Instr.global_get,
        global: r.readUint(),
      };
    case 0x24:
      return {
        op: Instr.global_set,
        global: r.readUint(),
      };

    case 0x25:
      return { op: Instr.table_get, index: r.readUint() };
    case 0x26:
      return { op: Instr.table_set, index: r.readUint() };

    case 0x28:
      return { op: Instr.i32_load, memarg: readMemArg(r) };
    case 0x29:
      return { op: Instr.i64_load, memarg: readMemArg(r) };
    case 0x2a:
      return { op: Instr.f32_load, memarg: readMemArg(r) };
    case 0x2b:
      return { op: Instr.f64_load, memarg: readMemArg(r) };
    case 0x2c:
      return { op: Instr.i32_load8_s, memarg: readMemArg(r) };
    case 0x2d:
      return { op: Instr.i32_load8_u, memarg: readMemArg(r) };
    case 0x2e:
      return { op: Instr.i32_load16_s, memarg: readMemArg(r) };
    case 0x2f:
      return { op: Instr.i32_load16_u, memarg: readMemArg(r) };
    case 0x30:
      return { op: Instr.i64_load8_s, memarg: readMemArg(r) };
    case 0x31:
      return { op: Instr.i64_load8_u, memarg: readMemArg(r) };
    case 0x32:
      return { op: Instr.i64_load16_s, memarg: readMemArg(r) };
    case 0x33:
      return { op: Instr.i64_load16_u, memarg: readMemArg(r) };
    case 0x34:
      return { op: Instr.i64_load32_s, memarg: readMemArg(r) };
    case 0x35:
      return { op: Instr.i64_load32_u, memarg: readMemArg(r) };
    case 0x36:
      return { op: Instr.i32_store, memarg: readMemArg(r) };
    case 0x37:
      return { op: Instr.i64_store, memarg: readMemArg(r) };
    case 0x38:
      return { op: Instr.f32_store, memarg: readMemArg(r) };
    case 0x39:
      return { op: Instr.f64_store, memarg: readMemArg(r) };
    case 0x3a:
      return { op: Instr.i32_store8, memarg: readMemArg(r) };
    case 0x3b:
      return { op: Instr.i32_store16, memarg: readMemArg(r) };
    case 0x3c:
      return { op: Instr.i64_store8, memarg: readMemArg(r) };
    case 0x3d:
      return { op: Instr.i64_store16, memarg: readMemArg(r) };
    case 0x3e:
      return { op: Instr.i64_store32, memarg: readMemArg(r) };

    case 0x3f:
      return { op: Instr.memory_size, mem: r.readUint() };
    case 0x40:
      return { op: Instr.memory_grow, mem: r.readUint() };

    case 0x41:
      return { op: Instr.i32_const, n: r.readSint() };
    case 0x42:
      return { op: Instr.i64_const, n: r.readSintBig() };
    case 0x43:
      return { op: Instr.f32_const, z: r.readF32() };
    case 0x44:
      return { op: Instr.f64_const, z: r.readF64() };

    case 0x45:
      return { op: Instr.i32_eqz };
    case 0x46:
      return { op: Instr.i32_eq };
    case 0x47:
      return { op: Instr.i32_ne };
    case 0x48:
      return { op: Instr.i32_lt_s };
    case 0x49:
      return { op: Instr.i32_lt_u };
    case 0x4a:
      return { op: Instr.i32_gt_s };
    case 0x4b:
      return { op: Instr.i32_gt_u };
    case 0x4c:
      return { op: Instr.i32_le_s };
    case 0x4d:
      return { op: Instr.i32_le_u };
    case 0x4e:
      return { op: Instr.i32_ge_s };
    case 0x4f:
      return { op: Instr.i32_ge_u };
    case 0x50:
      return { op: Instr.i64_eqz };
    case 0x51:
      return { op: Instr.i64_eq };
    case 0x52:
      return { op: Instr.i64_ne };
    case 0x53:
      return { op: Instr.i64_lt_s };
    case 0x54:
      return { op: Instr.i64_lt_u };
    case 0x55:
      return { op: Instr.i64_gt_s };
    case 0x56:
      return { op: Instr.i64_gt_u };
    case 0x57:
      return { op: Instr.i64_le_s };
    case 0x58:
      return { op: Instr.i64_le_u };
    case 0x59:
      return { op: Instr.i64_ge_s };
    case 0x5a:
      return { op: Instr.i64_ge_u };
    case 0x5b:
      return { op: Instr.f32_eq };
    case 0x5c:
      return { op: Instr.f32_ne };
    case 0x5d:
      return { op: Instr.f32_lt };
    case 0x5e:
      return { op: Instr.f32_gt };
    case 0x5f:
      return { op: Instr.f32_le };
    case 0x60:
      return { op: Instr.f32_ge };
    case 0x61:
      return { op: Instr.f64_eq };
    case 0x62:
      return { op: Instr.f64_ne };
    case 0x63:
      return { op: Instr.f64_lt };
    case 0x64:
      return { op: Instr.f64_gt };
    case 0x65:
      return { op: Instr.f64_le };
    case 0x66:
      return { op: Instr.f64_ge };
    case 0x67:
      return { op: Instr.i32_clz };
    case 0x68:
      return { op: Instr.i32_ctz };
    case 0x69:
      return { op: Instr.i32_popcnt };
    case 0x6a:
      return { op: Instr.i32_add };
    case 0x6b:
      return { op: Instr.i32_sub };
    case 0x6c:
      return { op: Instr.i32_mul };
    case 0x6d:
      return { op: Instr.i32_div_s };
    case 0x6e:
      return { op: Instr.i32_div_u };
    case 0x6f:
      return { op: Instr.i32_rem_s };
    case 0x70:
      return { op: Instr.i32_rem_u };
    case 0x71:
      return { op: Instr.i32_and };
    case 0x72:
      return { op: Instr.i32_or };
    case 0x73:
      return { op: Instr.i32_xor };
    case 0x74:
      return { op: Instr.i32_shl };
    case 0x75:
      return { op: Instr.i32_shr_s };
    case 0x76:
      return { op: Instr.i32_shr_u };
    case 0x77:
      return { op: Instr.i32_rotl };
    case 0x78:
      return { op: Instr.i32_rotr };
    case 0x79:
      return { op: Instr.i64_clz };
    case 0x7a:
      return { op: Instr.i64_ctz };
    case 0x7b:
      return { op: Instr.i64_popcnt };
    case 0x7c:
      return { op: Instr.i64_add };
    case 0x7d:
      return { op: Instr.i64_sub };
    case 0x7e:
      return { op: Instr.i64_mul };
    case 0x7f:
      return { op: Instr.i64_div_s };
    case 0x80:
      return { op: Instr.i64_div_u };
    case 0x81:
      return { op: Instr.i64_rem_s };
    case 0x82:
      return { op: Instr.i64_rem_u };
    case 0x83:
      return { op: Instr.i64_and };
    case 0x84:
      return { op: Instr.i64_or };
    case 0x85:
      return { op: Instr.i64_xor };
    case 0x86:
      return { op: Instr.i64_shl };
    case 0x87:
      return { op: Instr.i64_shr_s };
    case 0x88:
      return { op: Instr.i64_shr_u };
    case 0x89:
      return { op: Instr.i64_rotl };
    case 0x8a:
      return { op: Instr.i64_rotr };
    case 0x8b:
      return { op: Instr.f32_abs };
    case 0x8c:
      return { op: Instr.f32_neg };
    case 0x8d:
      return { op: Instr.f32_ceil };
    case 0x8e:
      return { op: Instr.f32_floor };
    case 0x8f:
      return { op: Instr.f32_trunc };
    case 0x90:
      return { op: Instr.f32_nearest };
    case 0x91:
      return { op: Instr.f32_sqrt };
    case 0x92:
      return { op: Instr.f32_add };
    case 0x93:
      return { op: Instr.f32_sub };
    case 0x94:
      return { op: Instr.f32_mul };
    case 0x95:
      return { op: Instr.f32_div };
    case 0x96:
      return { op: Instr.f32_min };
    case 0x97:
      return { op: Instr.f32_max };
    case 0x98:
      return { op: Instr.f32_copysign };
    case 0x99:
      return { op: Instr.f64_abs };
    case 0x9a:
      return { op: Instr.f64_neg };
    case 0x9b:
      return { op: Instr.f64_ceil };
    case 0x9c:
      return { op: Instr.f64_floor };
    case 0x9d:
      return { op: Instr.f64_trunc };
    case 0x9e:
      return { op: Instr.f64_nearest };
    case 0x9f:
      return { op: Instr.f64_sqrt };
    case 0xa0:
      return { op: Instr.f64_add };
    case 0xa1:
      return { op: Instr.f64_sub };
    case 0xa2:
      return { op: Instr.f64_mul };
    case 0xa3:
      return { op: Instr.f64_div };
    case 0xa4:
      return { op: Instr.f64_min };
    case 0xa5:
      return { op: Instr.f64_max };
    case 0xa6:
      return { op: Instr.f64_copysign };
    case 0xa7:
      return { op: Instr.i32_wrap_i64 };
    case 0xa8:
      return { op: Instr.i32_trunc_f32_s };
    case 0xa9:
      return { op: Instr.i32_trunc_f32_u };
    case 0xaa:
      return { op: Instr.i32_trunc_f64_s };
    case 0xab:
      return { op: Instr.i32_trunc_f64_u };
    case 0xac:
      return { op: Instr.i64_extend_i32_s };
    case 0xad:
      return { op: Instr.i64_extend_i32_u };
    case 0xae:
      return { op: Instr.i64_trunc_f32_s };
    case 0xaf:
      return { op: Instr.i64_trunc_f32_u };
    case 0xb0:
      return { op: Instr.i64_trunc_f64_s };
    case 0xb1:
      return { op: Instr.i64_trunc_f64_u };
    case 0xb2:
      return { op: Instr.f32_convert_i32_s };
    case 0xb3:
      return { op: Instr.f32_convert_i32_u };
    case 0xb4:
      return { op: Instr.f32_convert_i64_s };
    case 0xb5:
      return { op: Instr.f32_convert_i64_u };
    case 0xb6:
      return { op: Instr.f32_demote_f64 };
    case 0xb7:
      return { op: Instr.f64_convert_i32_s };
    case 0xb8:
      return { op: Instr.f64_convert_i32_u };
    case 0xb9:
      return { op: Instr.f64_convert_i64_s };
    case 0xba:
      return { op: Instr.f64_convert_i64_u };
    case 0xbb:
      return { op: Instr.f64_promote_f32 };
    case 0xbc:
      return { op: Instr.i32_reinterpret_f32 };
    case 0xbd:
      return { op: Instr.i64_reinterpret_f64 };
    case 0xbe:
      return { op: Instr.f32_reinterpret_i32 };
    case 0xbf:
      return { op: Instr.f64_reinterpret_i64 };
    case 0xc0:
      return { op: Instr.i32_extend8_s };
    case 0xc1:
      return { op: Instr.i32_extend16_s };
    case 0xc2:
      return { op: Instr.i64_extend8_s };
    case 0xc3:
      return { op: Instr.i64_extend16_s };
    case 0xc4:
      return { op: Instr.i64_extend32_s };

    case 0xd0:
      return { op: Instr.ref_null, type: readValType(r) };
    case 0xd1:
      return { op: Instr.ref_is_null };
    case 0xd2:
      return { op: Instr.ref_func, index: r.readUint() };

    case 0xfc: {
      const op = r.readUint();
      switch (op) {
        case 0:
          return { op: Instr.i32_trunc_sat_s_f32 };
        case 1:
          return { op: Instr.i32_trunc_sat_u_f32 };
        case 2:
          return { op: Instr.i32_trunc_sat_s_f64 };
        case 3:
          return { op: Instr.i32_trunc_sat_u_f64 };
        case 4:
          return { op: Instr.i64_trunc_sat_s_f32 };
        case 5:
          return { op: Instr.i64_trunc_sat_u_f32 };
        case 6:
          return { op: Instr.i64_trunc_sat_s_f64 };
        case 7:
          return { op: Instr.i64_trunc_sat_u_f64 };

        case 8:
          return { op: Instr.memory_init, data: r.readUint(), mem: r.readUint() };
        case 9:
          return { op: Instr.data_drop, data: r.readUint() };
        case 10:
          return { op: Instr.memory_copy, dstMem: r.readUint(), srcMem: r.readUint() };
        case 11:
          return { op: Instr.memory_fill, mem: r.readUint() };

        case 15:
          return { op: Instr.table_grow, index: r.readUint() };
        case 16:
          return { op: Instr.table_size, index: r.readUint() };
        case 17:
          return { op: Instr.table_fill, index: r.readUint() };

        default:
          throw new Error(`unhandled op fc ${op.toString(16)}`);
      }
    }

    case 0xfd: {
      const op = r.readUint();
      switch (op) {
        case 0:
          return { op: Instr.v128_load, memarg: readMemArg(r) };

        case 1:
          return { op: Instr.v128_load8x8_s, memarg: readMemArg(r) };
        case 2:
          return { op: Instr.v128_load8x8_u, memarg: readMemArg(r) };
        case 3:
          return { op: Instr.v128_load16x4_s, memarg: readMemArg(r) };
        case 4:
          return { op: Instr.v128_load16x4_u, memarg: readMemArg(r) };
        case 5:
          return { op: Instr.v128_load32x2_s, memarg: readMemArg(r) };
        case 6:
          return { op: Instr.v128_load32x2_u, memarg: readMemArg(r) };
        case 7:
          return { op: Instr.v128_load8_splat, memarg: readMemArg(r) };
        case 8:
          return { op: Instr.v128_load16_splat, memarg: readMemArg(r) };
        case 9:
          return { op: Instr.v128_load32_splat, memarg: readMemArg(r) };
        case 10:
          return { op: Instr.v128_load64_splat, memarg: readMemArg(r) };
        case 11:
          return { op: Instr.v128_store, memarg: readMemArg(r) };

        case 12:
          return { op: Instr.v128_const, bytes: r.slice(16) };

        case 13: {
          const lanes = new Array(16);
          for (let i = 0; i < 16; i++) {
            lanes[i] = r.readUint();
          }
          return { op: Instr.i8x16_shuffle, lanes };
        }

        case 15:
          return { op: Instr.i8x16_splat };
        case 16:
          return { op: Instr.i16x8_splat };
        case 17:
          return { op: Instr.i32x4_splat };
        case 18:
          return { op: Instr.i64x2_splat };
        case 19:
          return { op: Instr.f32x4_splat };
        case 20:
          return { op: Instr.f64x2_splat };

        case 21:
          return { op: Instr.i8x16_extract_lane_s, lane: r.read8() };
        case 22:
          return { op: Instr.i8x16_extract_lane_u, lane: r.read8() };
        case 23:
          return { op: Instr.i8x16_replace_lane, lane: r.read8() };
        case 24:
          return { op: Instr.i16x8_extract_lane_s, lane: r.read8() };
        case 25:
          return { op: Instr.i16x8_extract_lane_u, lane: r.read8() };
        case 26:
          return { op: Instr.i16x8_replace_lane, lane: r.read8() };
        case 27:
          return { op: Instr.i32x4_extract_lane, lane: r.read8() };
        case 28:
          return { op: Instr.i32x4_replace_lane, lane: r.read8() };
        case 29:
          return { op: Instr.i64x2_extract_lane, lane: r.read8() };
        case 30:
          return { op: Instr.i64x2_replace_lane, lane: r.read8() };
        case 31:
          return { op: Instr.f32x4_extract_lane, lane: r.read8() };
        case 32:
          return { op: Instr.f32x4_replace_lane, lane: r.read8() };
        case 33:
          return { op: Instr.f64x2_extract_lane, lane: r.read8() };
        case 34:
          return { op: Instr.f64x2_replace_lane, lane: r.read8() };

        case 35:
          return { op: Instr.i8x16_eq };
        case 36:
          return { op: Instr.i8x16_ne };
        case 37:
          return { op: Instr.i8x16_lt_s };
        case 38:
          return { op: Instr.i8x16_lt_u };
        case 39:
          return { op: Instr.i8x16_gt_s };
        case 40:
          return { op: Instr.i8x16_gt_u };
        case 41:
          return { op: Instr.i8x16_le_s };
        case 42:
          return { op: Instr.i8x16_le_u };
        case 43:
          return { op: Instr.i8x16_ge_s };
        case 44:
          return { op: Instr.i8x16_ge_u };
        case 45:
          return { op: Instr.i16x8_eq };
        case 46:
          return { op: Instr.i16x8_ne };
        case 47:
          return { op: Instr.i16x8_lt_s };
        case 48:
          return { op: Instr.i16x8_lt_u };
        case 49:
          return { op: Instr.i16x8_gt_s };
        case 50:
          return { op: Instr.i16x8_gt_u };
        case 51:
          return { op: Instr.i16x8_le_s };
        case 52:
          return { op: Instr.i16x8_le_u };
        case 53:
          return { op: Instr.i16x8_ge_s };
        case 54:
          return { op: Instr.i16x8_ge_u };
        case 55:
          return { op: Instr.i32x4_eq };
        case 56:
          return { op: Instr.i32x4_ne };
        case 57:
          return { op: Instr.i32x4_lt_s };
        case 58:
          return { op: Instr.i32x4_lt_u };
        case 59:
          return { op: Instr.i32x4_gt_s };
        case 60:
          return { op: Instr.i32x4_gt_u };
        case 61:
          return { op: Instr.i32x4_le_s };
        case 62:
          return { op: Instr.i32x4_le_u };
        case 63:
          return { op: Instr.i32x4_ge_s };
        case 64:
          return { op: Instr.i32x4_ge_u };

        case 77:
          return { op: Instr.v128_not };
        case 78:
          return { op: Instr.v128_and };
        case 79:
          return { op: Instr.v128_andnot };
        case 80:
          return { op: Instr.v128_or };
        case 81:
          return { op: Instr.v128_xor };
        case 82:
          return { op: Instr.v128_bitselect };
        case 83:
          return { op: Instr.v128_any_true };

        case 84:
          return { op: Instr.v128_load8_lane, memarg: readMemArg(r), lane: r.read8() };
        case 85:
          return { op: Instr.v128_load16_lane, memarg: readMemArg(r), lane: r.read8() };
        case 86:
          return { op: Instr.v128_load32_lane, memarg: readMemArg(r), lane: r.read8() };
        case 87:
          return { op: Instr.v128_load64_lane, memarg: readMemArg(r), lane: r.read8() };
        case 88:
          return { op: Instr.v128_store8_lane, memarg: readMemArg(r), lane: r.read8() };
        case 89:
          return { op: Instr.v128_store16_lane, memarg: readMemArg(r), lane: r.read8() };
        case 90:
          return { op: Instr.v128_store32_lane, memarg: readMemArg(r), lane: r.read8() };
        case 91:
          return { op: Instr.v128_store64_lane, memarg: readMemArg(r), lane: r.read8() };

        case 92:
          return { op: Instr.v128_load32_zero, memarg: readMemArg(r) };
        case 93:
          return { op: Instr.v128_load64_zero, memarg: readMemArg(r) };

        case 124:
          return { op: Instr.i16x8_extadd_pairwise_s_i8x16 };
        case 125:
          return { op: Instr.i16x8_extadd_pairwise_u_i8x16 };
        case 126:
          return { op: Instr.i32x4_extadd_pairwise_s_i16x8 };
        case 127:
          return { op: Instr.i32x4_extadd_pairwise_u_i16x8 };
        case 128:
          return { op: Instr.i16x8_abs };
        case 129:
          return { op: Instr.i16x8_neg };
        case 131:
          return { op: Instr.i16x8_all_true };
        case 132:
          return { op: Instr.i16x8_bitmask };
        case 133:
          return { op: Instr.i16x8_narrow_i32x4_s };
        case 134:
          return { op: Instr.i16x8_narrow_i32x4_u };
        case 135:
          return { op: Instr.i16x8_extend_low_s_i8x16 };
        case 136:
          return { op: Instr.i16x8_extend_high_s_i8x16 };
        case 137:
          return { op: Instr.i16x8_extend_low_u_i8x16 };
        case 138:
          return { op: Instr.i16x8_extend_high_u_i8x16 };
        case 139:
          return { op: Instr.i16x8_shl };
        case 140:
          return { op: Instr.i16x8_shr_s };
        case 141:
          return { op: Instr.i16x8_shr_u };
        case 130:
          return { op: Instr.i16x8_q15mulr_sat_s };
        case 142:
          return { op: Instr.i16x8_add };
        case 143:
          return { op: Instr.i16x8_add_sat_s };
        case 144:
          return { op: Instr.i16x8_add_sat_u };
        case 145:
          return { op: Instr.i16x8_sub };
        case 146:
          return { op: Instr.i16x8_sub_sat_s };
        case 147:
          return { op: Instr.i16x8_sub_sat_u };
        case 149:
          return { op: Instr.i16x8_mul };
        case 150:
          return { op: Instr.i16x8_min_s };
        case 151:
          return { op: Instr.i16x8_min_u };
        case 152:
          return { op: Instr.i16x8_max_s };
        case 153:
          return { op: Instr.i16x8_max_u };
        case 155:
          return { op: Instr.i16x8_avgr_u };
        case 156:
          return { op: Instr.i16x8_extmul_low_s_i8x16 };
        case 157:
          return { op: Instr.i16x8_extmul_high_s_i8x16 };
        case 158:
          return { op: Instr.i16x8_extmul_low_u_i8x16 };
        case 159:
          return { op: Instr.i16x8_extmul_high_u_i8x16 };

        case 160:
          return { op: Instr.i32x4_abs };
        case 161:
          return { op: Instr.i32x4_neg };
        case 163:
          return { op: Instr.i32x4_all_true };
        case 164:
          return { op: Instr.i32x4_bitmask };
        case 167:
          return { op: Instr.i32x4_extend_low_s_i16x8 };
        case 168:
          return { op: Instr.i32x4_extend_high_s_i16x8 };
        case 169:
          return { op: Instr.i32x4_extend_low_u_i16x8 };
        case 170:
          return { op: Instr.i32x4_extend_high_u_i16x8 };
        case 171:
          return { op: Instr.i32x4_shl };
        case 172:
          return { op: Instr.i32x4_shr_s };
        case 173:
          return { op: Instr.i32x4_shr_u };
        case 174:
          return { op: Instr.i32x4_add };
        case 177:
          return { op: Instr.i32x4_sub };
        case 181:
          return { op: Instr.i32x4_mul };
        case 182:
          return { op: Instr.i32x4_min_s };
        case 183:
          return { op: Instr.i32x4_min_u };
        case 184:
          return { op: Instr.i32x4_max_s };
        case 185:
          return { op: Instr.i32x4_max_u };
        case 186:
          return { op: Instr.i32x4_dot_s_i16x8 };
        case 188:
          return { op: Instr.i32x4_extmul_low_s_i16x8 };
        case 189:
          return { op: Instr.i32x4_extmul_high_s_i16x8 };
        case 190:
          return { op: Instr.i32x4_extmul_low_u_i16x8 };
        case 191:
          return { op: Instr.i32x4_extmul_high_u_i16x8 };

        case 192:
          return { op: Instr.i64x2_abs };
        case 193:
          return { op: Instr.i64x2_neg };
        case 195:
          return { op: Instr.i64x2_all_true };
        case 196:
          return { op: Instr.i64x2_bitmask };
        case 199:
          return { op: Instr.i64x2_extend_low_s_i32x4 };
        case 200:
          return { op: Instr.i64x2_extend_high_s_i32x4 };
        case 201:
          return { op: Instr.i64x2_extend_low_u_i32x4 };
        case 202:
          return { op: Instr.i64x2_extend_high_u_i32x4 };
        case 203:
          return { op: Instr.i64x2_shl };
        case 204:
          return { op: Instr.i64x2_shr_s };
        case 205:
          return { op: Instr.i64x2_shr_u };
        case 206:
          return { op: Instr.i64x2_add };
        case 209:
          return { op: Instr.i64x2_sub };
        case 213:
          return { op: Instr.i64x2_mul };
        case 214:
          return { op: Instr.i64x2_eq };
        case 215:
          return { op: Instr.i64x2_ne };
        case 216:
          return { op: Instr.i64x2_lt_s };
        case 217:
          return { op: Instr.i64x2_gt_s };
        case 218:
          return { op: Instr.i64x2_le_s };
        case 219:
          return { op: Instr.i64x2_ge_s };

        case 220:
          return { op: Instr.i64x2_extmul_low_s_i32x4 };
        case 221:
          return { op: Instr.i64x2_extmul_high_s_i32x4 };
        case 222:
          return { op: Instr.i64x2_extmul_low_u_i32x4 };
        case 223:
          return { op: Instr.i64x2_extmul_high_u_i32x4 };

        case 273:
          return { op: Instr.i16x8_relaxed_q15mulr_s };
        case 274:
          return { op: Instr.i16x8_relaxed_dot_s_i8x16 };
        case 275:
          return { op: Instr.i32x4_relaxed_dot_add_s_i16x8 };
      }
      throw new Error(`unhandled op 0xfd ${op}`);
    }

    default:
      throw new Error(`unhandled op ${op.toString(16)}`);
  }
}

function readInstrs(r: Reader): [Instruction[], Instr] {
  const instrs: Instruction[] = [];
  while (true) {
    const instr = readInstruction(r);
    if (instr.op === Instr.end || instr.op === Instr.else) {
      return [instrs, instr.op];
    }
    instrs.push(instr);
  }
}

export function readExpr(r: Reader) {
  return readInstrs(r)[0];
}

export function readFunction(r: Reader): Function {
  const locals: Type[] = [];
  const len = r.readUint();
  for (let i = 0; i < len; i++) {
    const count = r.readUint();
    const type = readValType(r);
    for (let j = 0; j < count; j++) {
      locals.push(type);
    }
  }
  const body = readExpr(r);
  return { locals, body };
}

export function read(r: Reader): FunctionHeader[] {
  const funcs = r.vec(() => {
    const size = r.readUint();
    const header = { ofs: r.view.byteOffset + r.ofs, len: size };
    r.skip(size);
    return header;
  });
  return funcs;
}

export function instrToString(instr: Instruction): string {
  const toPrint = [instr.op.toString()];
  for (const [key, val] of Object.entries(instr)) {
    if (key === 'op') continue;
    if (val instanceof Array) continue;
    if (key === 'memarg') {
      const arg = val as MemArg;
      if (arg.index !== 0) {
        toPrint.push(`index=${arg.index}`);
      }
      toPrint.push(`align=${arg.align}`);
      toPrint.push(`offset=${arg.offset}`);
    } else {
      toPrint.push(`${key}=${val}`);
    }
  }
  return toPrint.join(' ');
}

export function print(instrs: Instruction[], indent = 0) {
  for (const instr of instrs) {
    console.log('  '.repeat(indent), instrToString(instr));
    if (
      instr.op === Instr.if
      || instr.op === Instr.block
      || instr.op === Instr.loop
    ) {
      print(instr.body, indent + 1);
      if (instr.op === Instr.if && instr.else) {
        console.log('  '.repeat(indent) + 'else');
        print(instr.else, indent + 1);
      }
    }
  }
}

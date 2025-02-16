/**
 * Defines ParsedModule, a loaded and parsed wasm module,
 * and helper components that work with the module.
 */

import * as wasm from 'wasm';
import { Link } from './viz';
import { Fragment, h } from 'preact';
import * as wasmCode from 'wasm/code';

export type Indexed<T> = T & { index: number };
export interface FunctionSpan {
  typeidx: number;
  ofs: number;
  len: number;
}
export type Toolchain = 'Go' | 'Rust' | 'Unknown';
export interface ParsedModule {
  bytes: ArrayBuffer;
  sections: (wasm.SectionHeader & { name?: string })[];
  toolchain: Toolchain;

  names?: wasm.NameSection;
  producers?: wasm.ProducersField[];
  types: wasm.FuncType[];
  imports: Indexed<wasm.Import>[];
  exports: wasm.Export[];
  functions: Indexed<FunctionSpan>[];
  tables: Indexed<wasm.TableType>[];
  elements: Indexed<wasm.Element>[];
  data: Indexed<wasm.DataSectionData>[];
  globals: Indexed<wasm.Global>[];
  memories: Indexed<wasm.Limits>[];
  customSectionData: Map<number, DataView>;

  functionNames: Map<number, string>;
  globalNames: Map<number, string>;
  dataNames: Map<number, string>;
}


export function FunctionRef(props: { module: ParsedModule; index: number }) {
  return (
    <Link title={`function ${props.index}`} target={['function', props.index]}>
      {props.module.functionNames.get(props.index) ?? `function ${props.index}`}
    </Link>
  );
}

export function GlobalRef(props: { module: ParsedModule; index: number }) {
  const sec = props.module.sections.find(
    (sec) => sec.kind === wasm.SectionKind.global,
  )!;

  return (
    <Link title={`global ${props.index}`} target={['section', sec.index]}>
      {props.module.globalNames.get(props.index) ?? `global ${props.index}`}
    </Link>
  );
}


export function FunctionType(props: { type: wasm.FuncType }) {
  return <code>{wasm.funcTypeToString(props.type)}</code>;
}

export function loadModule(wasmBytes: ArrayBuffer) {
  const sections = wasm.read(wasmBytes);
  const module: ParsedModule = {
    bytes: wasmBytes,
    toolchain: 'Unknown',
    sections: sections.map((sec, index) => ({ ...sec, index })),
    types: [],
    imports: [],
    tables: [],
    exports: [],
    functions: [],
    data: [],
    elements: [],
    globals: [],
    memories: [],
    customSectionData: new Map(),
    functionNames: new Map(),
    globalNames: new Map(),
    dataNames: new Map(),
  };
  (window as any)['module'] = module;

  let importedFunctionCount = 0;
  let importedGlobalCount = 0;
  for (const section of module.sections) {
    switch (section.kind) {
      case wasm.SectionKind.custom: {
        const reader = wasm.getSectionReader(wasmBytes, section);
        const custom = wasm.readCustomSection(reader);
        switch (custom.name) {
          case 'name':
            section.name = 'name';
            const names = wasm.readNameSection(reader);
            module.names = names;
            if (names.functionNames) {
              for (const [idx, name] of names.functionNames) {
                if (module.functionNames.has(idx)) {
                  continue;
                }
                module.functionNames.set(idx, name);
              }
            }
            if (names.globalNames) {
              module.globalNames = names.globalNames;
            }
            if (names.dataNames) {
              module.dataNames = names.dataNames;
            }
            break;
          case 'producers':
            section.name = 'producers';
            const producers = wasm.readProducersSection(reader);
            const lang = producers.find((p) => p.name == 'language');
            if (lang) {
              switch (lang.values[0].name) {
                case 'Go':
                  module.toolchain = 'Go';
                  break;
                case 'Rust':
                  module.toolchain = 'Rust';
                  break;
              }
            }
            module.producers = producers;
            break;
          default: {
            const view = new DataView(
              reader.view.buffer,
              reader.view.byteOffset + reader.ofs,
              reader.view.byteLength - reader.ofs,
            );
            section.name = `custom: '${custom.name}'`;
            module.customSectionData.set(section.index, view);
            break;
          }
        }
        break;
      }
      case wasm.SectionKind.type:
        module.types = wasm
          .readTypeSection(wasm.getSectionReader(wasmBytes, section))
          .map((t, i) => {
            return { ...t, index: i };
          });
        break;
      case wasm.SectionKind.import:
        module.imports = wasm
          .readImportSection(wasm.getSectionReader(wasmBytes, section))
          .map((imp) => {
            switch (imp.desc.kind) {
              case wasm.DescKind.typeidx:
                module.functionNames.set(importedFunctionCount, imp.name);
                return { ...imp, index: importedFunctionCount++ };
              case wasm.DescKind.global:
                importedGlobalCount++;
              // TODO don't fall through
              default:
                return { ...imp, index: 'todo' as any };
            }
          });
        break;
      case wasm.SectionKind.function:
        module.functions = wasm
          .readFunctionSection(wasm.getSectionReader(wasmBytes, section))
          .map((typeidx, i) => {
            return {
              index: importedFunctionCount + i,
              typeidx,
              ofs: 0,
              len: 0,
            };
          });
        break;
      case wasm.SectionKind.table:
        module.tables = wasm
          .readTableSection(wasm.getSectionReader(wasmBytes, section))
          .map((table, i) => ({ ...table, index: i }));
        break;
      case wasm.SectionKind.global:
        module.globals = wasm
          .readGlobalSection(wasm.getSectionReader(wasmBytes, section))
          .map((global, i) => ({ ...global, index: importedGlobalCount + i }));
        break;
      case wasm.SectionKind.memory:
        module.memories = wasm
          .readMemorySection(wasm.getSectionReader(wasmBytes, section))
          .map((memory, i) => ({ ...memory, index: i }));
        break;
      case wasm.SectionKind.export:
        module.exports = wasm.readExportSection(
          wasm.getSectionReader(wasmBytes, section),
        );
        for (const exp of module.exports) {
          if (exp.desc.kind == wasm.DescKind.funcidx) {
            module.functionNames.set(exp.desc.index, exp.name);
          }
        }
        break;
      case wasm.SectionKind.element:
        module.elements = wasm
          .readElementSection(wasm.getSectionReader(wasmBytes, section))
          .map((elem, i) => ({ ...elem, index: i }));
        break;
      case wasm.SectionKind.code:
        wasmCode
          .read(wasm.getSectionReader(wasmBytes, section))
          .forEach((func, i) => {
            module.functions[i].ofs = func.ofs;
            module.functions[i].len = func.len;
          });
        break;
      case wasm.SectionKind.data:
        module.data = wasm
          .readDataSection(wasm.getSectionReader(wasmBytes, section))
          .map((data, index) => ({ ...data, index }));
        break;
    }
  }
  return module;
}
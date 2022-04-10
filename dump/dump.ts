import * as fs from 'fs';
import * as wasm from 'wasm';
import * as code from 'wasm/code';

function main(args: string[]) {
  const file = fs.readFileSync(args[0]);
  const buf = file.buffer.slice(
    file.byteOffset,
    file.byteOffset + file.byteLength
  );

  const module = wasm.read(new DataView(buf));
  let funcIndex = 0;
  for (const sec of module.sections) {
    console.log(`# section: ${sec.type} (${sec.len} bytes)`);
    switch (sec.type) {
      case wasm.SectionType.type: {
        const types = wasm.readTypeSection(module.getReader(sec));
        for (let i = 0; i < types.length; i++) {
          console.log(`  ${i}: ${wasm.funcTypeToString(types[i])}`);
        }
        break;
      }
      case wasm.SectionType.import:
        for (const imp of wasm.readImportSection(module.getReader(sec))) {
          switch (imp.desc.type) {
            case wasm.IndexType.type:
              console.log(`  func ${funcIndex++}: ${wasm.importToString(imp)}`);
              break;
            default:
              console.log(`  ${wasm.importToString(imp)}`);
          }
        }
        break;
      case wasm.SectionType.export:
        for (const exp of wasm.readExportSection(module.getReader(sec))) {
          console.log(`  ${wasm.exportToString(exp)}`);
        }
        break;
      case wasm.SectionType.code:
        for (const func of code.read(module.getReader(sec))) {
          console.log(`  func ${funcIndex++}`);
          if (func.locals.length > 0) {
            console.log('    locals', func.locals);
          }
          code.print(func.body, 2);
        }
        break;
    }
  }
}

main(process.argv.slice(2));

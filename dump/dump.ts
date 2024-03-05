import * as fs from 'fs';
import * as wasm from 'wasm';
import * as code from 'wasm/code';

function main(args: string[]) {
  const file = fs.readFileSync(args[0]);
  const buf = file.buffer.slice(
    file.byteOffset,
    file.byteOffset + file.byteLength,
  );

  const module = wasm.read(buf);
  let funcIndex = 0;
  for (const sec of module) {
    console.log(`# section: ${sec.kind} (${sec.len} bytes)`);
    switch (sec.kind) {
      case wasm.SectionKind.type: {
        const types = wasm.readTypeSection(wasm.getSectionReader(buf, sec));
        for (let i = 0; i < types.length; i++) {
          console.log(`  ${i}: ${wasm.funcTypeToString(types[i])}`);
        }
        break;
      }
      case wasm.SectionKind.import:
        for (const imp of wasm.readImportSection(wasm.getSectionReader(buf, sec))) {
          switch (imp.desc.kind) {
            case wasm.DescKind.typeidx:
              console.log(`  func ${funcIndex++}: ${wasm.importToString(imp)}`);
              break;
            default:
              console.log(`  ${wasm.importToString(imp)}`);
          }
        }
        break;
      case wasm.SectionKind.export:
        for (const exp of wasm.readExportSection(wasm.getSectionReader(buf, sec))) {
          console.log(`  ${wasm.exportToString(exp)}`);
        }
        break;
      case wasm.SectionKind.code:
        for (const funcHeader of code.read(wasm.getSectionReader(buf, sec))) {
          const func = code.readFunction(
            new wasm.Reader(new DataView(buf, funcHeader.ofs, funcHeader.len)),
          );

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

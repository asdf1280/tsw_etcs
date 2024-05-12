// in global.ts, the list of symbol names are defined. By default, they're 'string' type, but we can generate a type for them like this:
// "A" | "B" | "C"

// This script generates the type for the symbol names

const fs = require('fs');

let buf = fs.readFileSync("../src/script/symbols.json", "utf-8");
/**
 * @type {Array<{name: string}>}
 */
let obj = JSON.parse(buf);

let names = obj.map(x => '"' + x.name + '"');
console.log(`type SymbolName = ${names.join(" | ")};`)

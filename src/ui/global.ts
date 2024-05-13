import AudioModule from "../sound/AudioModule";
{
    let r = require.context('../symbol/', true, /\.png$/);
    r.keys().forEach(r);
}

export const Audio: AudioModule = new AudioModule();

export interface Symbol {
    name: string;
    imagePath: string;
    disabledImagePath: string | undefined;
    cells: [number, number];
}

export type SymbolName = string

export const Symbols: Record<SymbolName, Symbol> = {};

let data = JSON.parse(require("./symbols.json") as string) as Symbol[];
data.forEach((symbol) => {
    Symbols[symbol.name] = symbol;
    symbol.imagePath = require("../symbol/" + symbol.imagePath + ".png");
    if (symbol.disabledImagePath) symbol.disabledImagePath = require("../symbol/" + symbol.disabledImagePath + ".png");
});
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const MODULE_NAME = '@thoughtspot/visual-embed-sdk';
const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = resolve(__dirname, '../lib/src/visual-embed-sdk.d.ts');

let content = readFileSync(filePath, 'utf8');

content = content
    .replace(/^export declare /gm, 'export ')
    .replace(/^declare /gm, '')
    .replace(/\nexport {};\n/g, '\n');

writeFileSync(
    filePath,
    `declare module '${MODULE_NAME}' {\n${content}}\n`,
);

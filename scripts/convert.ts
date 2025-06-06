// file for generating types

import { TypeScriptConverter, createDartConversionConfig, LogLevel } from '@thoughtspot/ts-to-any/src';
import path from 'path';
import fs from 'fs';

const inputFolder: string = process.env.node;
const outputFolder: string = process.env.output;

if (!inputFolder || !outputFolder) {
  throw new Error('inputFolder and outputFolder are required');
}

const config = createDartConversionConfig({
  useJsonSerializable: true,
  skipTypes: [
    'CustomCssVariables',
    'customCssInterfaceRules_UNSTABLE',
    'EmbedConfigAdditionalFlags',
    'ViewConfigAdditionalFlags',
    'LiveboardViewConfigAdditionalFlags'
  ],
  additionalTypeMappings: {
    'customCssInterfaceRules_UNSTABLE': 'Map<String, dynamic>',
    'CustomCssVariables': 'Map<String, dynamic>',
    'EmbedConfigAdditionalFlags': 'Map<String, dynamic>',
    'ViewConfigAdditionalFlags': 'Map<String, dynamic>',
    'LiveboardViewConfigAdditionalFlags': 'Map<String, dynamic>',
    'Record<string, string>': 'Map<String, String>',
  },
  headerContent: `
import 'package:json_annotation/json_annotation.dart';
part 'types.g.dart';
  `,
  inlineTypeNameFormatter: (names: string[]) => {
    return names.map((name, i) => i === 0 ? name : name.charAt(0).toUpperCase() + name.slice(1)).join('');
  },
});
const converter = new TypeScriptConverter({
  conversionConfig: config,
  inputConfig: {
    inputFiles: [
      path.resolve(inputFolder, 'src/types.ts'),
      path.resolve(inputFolder, 'src/css-variables.ts'),
      path.resolve(inputFolder, 'src/utils/graphql/answerService/answerService.ts'),
      path.resolve(inputFolder, 'src/embed/liveboard.ts'),
    ]
  },
});

const result = converter.convert();
fs.writeFileSync(path.resolve(outputFolder, 'types.dart'), result);

import fs from 'fs';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Config, createGenerator } from 'ts-json-schema-generator';

/**
 * "AuthType": {
      "type": "string",
      "enum": [
        "None",
        "EmbeddedSSO",
        "SSO_SAML",
        "SSO_OIDC",
        "AuthServer",
        "AuthServerCookieless",
        "Basic"
      ],
 * "description": "The authentication mechanism for allowing access to the the embedded
 * app"
    },
 */

const enumTemplate = `
enum {{name}} {
{{#options}}}
 {{value}}{{name}}
{{/options}}
}
`;

const convertJsonEnumToDartEnum = (jsonEnum: any) => jsonEnum.enum.map((item: string) => `  ${item}`).join('\n');

/** @type {import('ts-json-schema-generator').Config} */
const config: Config = {
    path: 'src/types.ts',
    // tsconfig: './tsconfig.json',
    type: '*', // Or <type-name> if you want to generate schema for that one type only
    expose: 'all',
};

const convertEnumToDartEnum = (enumName: string, enumOptions: string[]) => enumTemplate.replace('{{name}}', enumName).replace('{{options}}', enumOptions.map((option) => `  ${option}`).join('\n'));

const outputPath = './schema.json';

console.log('adw');
try {
    const schema = createGenerator(config).createSchema(config.type);
    const schemaString = JSON.stringify(schema, null, 2);
    fs.writeFileSync(outputPath, schemaString);
} catch (error) {
    console.error('Error generating schema:', error.message);
    process.exit(1);
}

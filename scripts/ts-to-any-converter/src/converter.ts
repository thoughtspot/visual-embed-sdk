/* eslint-disable import/no-extraneous-dependencies */
import {
    Project, SyntaxKind, EnumDeclaration, InterfaceDeclaration,
    PropertyDeclaration,
    PropertySignature,
    Type,
} from 'ts-morph';
import fs from 'fs';
import path from 'path';
import Mustache from 'mustache';
import { IEnum, IInterface, TemplateType } from './types/intermediate';
import { ConverterConfig } from './types/converter-types';
import { writeToFileAsync } from './utils';

// We will first convert the ast format to a intermediate format that is easier
// to handle

class TypeScriptConverter {
    readonly project: Project;

    private finalOutputString = '';

    private configs: ConverterConfig;

    private templateDefaultPaths = {
        [TemplateType.Enum]: 'enum.mustache',
        [TemplateType.Interface]: 'interface.mustache',
    }

    private templates: Record<TemplateType, string>;

    /**
     * Loads the templates from the templates directory
     * @returns The templates
     */
    private updateTemplates() {
        const defaultTemplateRoot = path.resolve(__dirname, 'templates/dart');
        const templatePaths = this.templateDefaultPaths;

        this.templates = {} as Record<TemplateType, string>;
        Object.keys(templatePaths).forEach((templateType) => {
            const templatePath = path.resolve(defaultTemplateRoot, templatePaths[templateType]);
            this.templates[templateType] = fs.readFileSync(templatePath, 'utf8');
        });

        return this.templates;
    }

    constructor(configs: ConverterConfig) {
        // load the template
        this.project = new Project();
        this.updateTemplates();
        this.configs = configs;
        this.finalOutputString = '';
    }

    renderTemplate(templateType: TemplateType, data: Record<string, any>) {
        const template = this.templates[templateType];
        return Mustache.render(template, data);
    }

    appendToFinalOutput(output: string) {
        this.finalOutputString += output;
    }

    convertEnumToIntermediate(enumDeclaration: EnumDeclaration): IEnum {
        const enumName = enumDeclaration.getName();
        const members = enumDeclaration.getMembers().map((member, index) => {
            const key = member.getName();
            const value = member.getInitializer()?.getText().replace(/['"]/g, ''); // Remove quotes
            const comment = member.getJsDocs().map((doc) => doc.getText()).join('');
            return {
                name: key, value, comment, isLast: index === enumDeclaration.getMembers().length - 1,
            };
        });

        const comment = enumDeclaration.getJsDocs().map((doc) => doc.getText()).join('');

        return addPrev({
            name: enumName,
            options: members,
            type: 'enum',
            comment,
        });
    }

    // todo : just demo will update later
    extractType = (propType: Type) => {
        if (propType.isArray()) {
            const type = propType.getArrayElementType();
            if (type) {
                return {
                    name: this.extractType(type).name,
                    isArray: true,
                };
            }
            return {
                name: 'unknown',
                isArray: true,
            };
        }

        if (propType.isObject() || propType.isEnum()) {
            return {
                name: propType.getSymbol()?.getName(),
                isArray: false,
            };
        }

        return {
            name: propType.getText(),
            isArray: false,
        };
    }

    // this will store the dynamic types that are created
    // this will have the intermediate format
    private dynamicTypes = {};

    createDynamicType = (property: PropertySignature, interfaceName: string): IInterface => {
        if (this.dynamicTypes[interfaceName]) {
            return this.dynamicTypes[interfaceName];
        }

        const newName = `${interfaceName}__${property.getName()}`;

        const properties = property.getType().getProperties().map((nestedProperty) => {
            const name = nestedProperty.getName();
            const type = this.extractType(nestedProperty.getTypeAtLocation(property));
            return type;
        });

        this.dynamicTypes[newName] = {
            name: newName,
            properties,
        };
        return {
            name: newName,
            properties,
        };
    }

    handleEnum = (enumDeclaration: EnumDeclaration) => {
        const enumIntermediate = this.convertEnumToIntermediate(enumDeclaration);
        return this.renderTemplate(TemplateType.Enum, enumIntermediate);
    }

    convertInterfaceToIntermediate = (interfaceDeclaration: InterfaceDeclaration) => {
        const interfaceName = interfaceDeclaration.getName?.();

        const properties = interfaceDeclaration.getProperties().map((property) => {
            const name = property.getName();
            let type = this.extractType(property.getType());
            if (type.name === '__type') {
                type = this.createDynamicType(property, interfaceName);
            }
            return {
                name,
                type,
            };
        });

        return addPrev({
            name: interfaceName,
            properties,
            type: 'interface',
        });
    }

    handleInterface = (interfaceDeclaration: InterfaceDeclaration) => {
        const interfaceIntermediate = this.convertInterfaceToIntermediate(interfaceDeclaration);
        return this.renderTemplate(TemplateType.Interface, interfaceIntermediate);
    }

    convert() {
        const finalOutputs: string[] = [];
        this.configs.inputs.forEach((input) => {
            const sourceFile = this.project.addSourceFileAtPath(input);

            const enumContent = sourceFile.getEnums().map(this.handleEnum);
            const interfaceContent = sourceFile.getInterfaces().map(this.handleInterface);
            const dynamicTypeContent = this.dynamicTypes.map()
            
            finalOutputs.push(...enumContent, ...interfaceContent);
            Object.keys(this.dynamicTypes).forEach((key) => {
                this.appendToFinalOutput(
                    this.renderTemplate(TemplateType.Interface, this.dynamicTypes[key]),
                );
            });
        });
        return finalOutputs.join('\n');
    }

    convertAndWriteToFile(options: { outPutFile: string }) {
        const output = this.convert();
        return writeToFileAsync(options.outPutFile, output);
    }

    writeOutput() {
        fs.writeFileSync(this.configs.output, this.finalOutputString);
    }
}

/**
 *
 */
function main() {
    const converter = new TypeScriptConverter({
        inputs: ['src/types.ts'],
        output: 'my.dart',
    });
    converter.convert();
}

main();

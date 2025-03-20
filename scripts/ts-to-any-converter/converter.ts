/* eslint-disable import/no-extraneous-dependencies */
import {
    Project, SyntaxKind, EnumDeclaration, InterfaceDeclaration,
} from 'ts-morph';
import fs from 'fs';
import path from 'path';
import Mustache from 'mustache';
import { IEnum, TemplateType } from './types/intermediate';
import { ConverterConfig } from './types/converter-types';

const addPrev = <T>(obj: T): T => {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    Object.keys(obj).forEach((key) => {
        const child = obj[key];

        if (Array.isArray(child)) {
            child.forEach((item, idx) => {
                obj[key][idx] = addPrev(item);
                obj[key][idx]._prev = obj;
            });
        } else if (typeof child === 'object') {
            obj[key] = addPrev(obj[key]);
            // eslint-disable-next-line no-underscore-dangle
            obj[key]._prev = obj;
        }
    });
    return obj;
};

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

  handleEnum = (enumDeclaration: EnumDeclaration) => {
      const enumIntermediate = this.convertEnumToIntermediate(enumDeclaration);
      return this.renderTemplate(TemplateType.Enum, enumIntermediate);
  }

  handleInterface = (interfaceDeclaration: InterfaceDeclaration) => {
      const interfaceName = interfaceDeclaration.getName();
      const properties = interfaceDeclaration.getProperties().map((property) => {
          const name = property.getName();
          const type = property.getType().getText();
          return {
              name,
              type,
          };
      });
  }

  convert() {
      this.configs.inputs.forEach((input) => {
          const sourceFile = this.project.addSourceFileAtPath(input);
          const enums = sourceFile.getEnums().map(this.handleEnum);
          this.appendToFinalOutput(enums.join('\n'));
      });

      this.writeOutput();
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

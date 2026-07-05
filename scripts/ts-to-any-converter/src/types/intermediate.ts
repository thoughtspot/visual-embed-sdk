export interface IEnum {
  type: 'enum';
  name: string;
  options: {
    name: string;
    value?: string;
    comment?: string;
  }[];
}

export interface INumber {
  type: 'number';
}

export interface IString {
  type: 'string';
}

export interface IBoolean {
  type: 'boolean';
}

export interface IInterface {
  name: string;
  comment?: string;
  properties: {
    name: string;
    type: {
      name: string;
      isArray: boolean;
    };
    comment?: string;
  }[];
}

export enum TemplateType {
  Enum = 'enum',
  Interface = 'interface',
}

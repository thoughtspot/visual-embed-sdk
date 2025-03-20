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
  properties: {
    name: string;
    type: IEnum | IInterface | INumber | IString | IBoolean;
  }[];
}

export enum TemplateType {
  Enum = 'enum',
  Interface = 'interface',
}

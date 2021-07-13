export interface DataRequestStringDataType {
    type: 'string';
}
export interface DataRequestNumberDataType {
    multiplier: string;
    type: 'number';
}

export type DataRequestDataType = DataRequestNumberDataType | DataRequestStringDataType;

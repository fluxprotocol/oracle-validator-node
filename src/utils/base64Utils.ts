export function base64Encode(str: string) {
    return Buffer.from(str, 'binary').toString('base64');
};

export function base64Decode(encodedString: string) {
    return Buffer.from(encodedString, 'base64').toString('binary');
}

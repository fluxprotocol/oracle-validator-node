const START_CHARS = 15;
const END_CHARS = 5;
const MAX_LENGTH = 25;

export function truncate(text: string) {
    if (text.length > MAX_LENGTH) {
        var start = text.substring(0, START_CHARS);
        var end = text.substring(text.length - END_CHARS, text.length);
        return start + '...' + end;
    }
    return text;
}

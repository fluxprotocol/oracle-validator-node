export function assert(bool: boolean, message = "ASSERT_FAILED"): void {
    if (!bool) {
        throw new Error(message);
    }
}

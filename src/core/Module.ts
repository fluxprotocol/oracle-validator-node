export interface Module {
    start(): void;
    on(name: string, listener: () => void): void;
}

import { Terminal } from "./Terminal.ts";

export abstract class ElectronicComponent {
    abstract readonly type: string;

    protected constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly terminals: readonly Terminal[],
    ) {
        if (!id.trim()){
            throw new Error("Component id is required")
        }
        
        if (new Set(terminals.map(t => t.id)).size !== terminals.length) {
            throw new Error("Terminal ids must be unique per component");
        }
    }

    getTerminal(id: string): Terminal | undefined {
        return this.terminals.find(t => t.id === id);
    }

    abstract getProperties(): Record<string, unknown>;
}
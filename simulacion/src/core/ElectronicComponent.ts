import { Terminal } from "./Terminal.ts";

export abstract class ElectronicComponent {
    abstract readonly type: string;
    readonly id: string;
    readonly name: string;
    readonly terminals: readonly Terminal[];

    protected constructor(
        id: string,
        name: string,
        terminals: readonly Terminal[],
    ) {
        this.id = id;
        this.name = name;
        this.terminals = terminals;

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
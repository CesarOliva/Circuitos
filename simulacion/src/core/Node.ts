export interface TerminalReference {
    componentId: string;
    terminalId: string;
}

export class Node {
    readonly id: string;
    readonly terminals: readonly TerminalReference[];

    constructor(
        id: string,
        terminals: readonly TerminalReference[]
    ) {
        this.id = id;
        this.terminals = terminals;
    }

    hasTerminal(
        componentId: string,
        terminalId: string
    ): boolean {
        return this.terminals.some(
            terminal => 
                terminal.componentId === componentId &&
                terminal.terminalId === terminalId
        );
    }

    getTerminalCount(): number {
        return this.terminals.length;
    }
}
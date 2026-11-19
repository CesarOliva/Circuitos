import type { TerminalReference } from "./Node.ts";

export class Connection {
    readonly id: string;
    readonly from: TerminalReference;
    readonly to: TerminalReference;

    constructor(
        id: string,
        from: TerminalReference,
        to: TerminalReference
    ) {
        this.id = id;
        this.from = from;
        this.to = to;

        if (
            from.componentId === to.componentId &&
            from.terminalId === to.terminalId
        ) {
            throw new Error("A terminal cannot connect to itself");
        }
    }


    involvesComponent(componentId: string): boolean {
        return (
            this.from.componentId === componentId ||
            this.to.componentId === componentId
        )
    }

    involvesTerminal(
        componentId: string,
        terminalId: string
    ): boolean {
        return (
            (this.from.componentId === componentId &&
                this.from.terminalId === terminalId) ||
            (this.to.componentId === componentId &&
                this.from.terminalId === terminalId)
        )
    }
}
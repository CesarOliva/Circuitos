export type TerminalType =
    | "positive" 
    | "negative" 
    | "anode" 
    | "cathode"
    | "bidirectional" 
    | "base" 
    | "collector" 
    | "emitter" 
    | "wiper"
    | "input"
    | "output";

export class Terminal {
    readonly id: string;
    readonly name: string;
    readonly type: TerminalType;

    constructor(
        id: string,
        name: string,
        type: TerminalType,
    ) {
        this.id = id;
        this.name = name;
        this.type = type;
    }
}
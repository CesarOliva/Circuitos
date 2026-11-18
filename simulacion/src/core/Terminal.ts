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
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly type: TerminalType,
    ) {}
}
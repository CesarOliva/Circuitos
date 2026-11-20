import { ElectronicComponent } from "../../core/ElectronicComponent.ts";
import { Terminal } from "../../core/Terminal.ts";

export const BREADBOARD_ROWS = 30;
export const BREADBOARD_GROUPS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"] as const;
export const BREADBOARD_RAILS = ["+", "-"] as const;
export const breadboardTerminalIds = [
    ...BREADBOARD_GROUPS.flatMap(group => Array.from({ length: BREADBOARD_ROWS }, (_, row) => `${group}${row + 1}`)),
    ...BREADBOARD_RAILS.flatMap(rail => Array.from({ length: BREADBOARD_ROWS }, (_, row) => `rail${rail}${row + 1}`)),
];

export class Breadboard extends ElectronicComponent {
    readonly type = "breadboard";

    constructor(id: string) {
        super(id, "Breadboard", breadboardTerminalIds.map(id => new Terminal(id, id, "bidirectional")));
    }

    getProperties() {
        return { rows: BREADBOARD_ROWS, connectedGroups: 10, powerRails: 2 };
    }

    getConnectedTerminalGroups(): string[][] {
        const groups = BREADBOARD_GROUPS.map(group => Array.from({ length: BREADBOARD_ROWS }, (_, row) => `${group}${row + 1}`));
        groups.push(...BREADBOARD_RAILS.map(rail => Array.from({ length: BREADBOARD_ROWS }, (_, row) => `rail${rail}${row + 1}`)));
        return groups;
    }
}

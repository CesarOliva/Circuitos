import { ElectronicComponent } from "../../core/ElectronicComponent.ts";
import { Terminal } from "../../core/Terminal.ts";

export const BREADBOARD_ROWS = 30;
export const BREADBOARD_GROUPS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"] as const;
export const BREADBOARD_RAILS = ["top+", "top-", "bottom+", "bottom-"] as const;
export const breadboardTerminalIds = [
    ...BREADBOARD_GROUPS.flatMap(group => Array.from({ length: BREADBOARD_ROWS }, (_, row) => `${group}${row + 1}`)),
    ...BREADBOARD_RAILS.flatMap(rail => Array.from({ length: BREADBOARD_ROWS }, (_, row) => `${rail}${row + 1}`)),
];

const HALVES = [BREADBOARD_GROUPS.slice(0, 5), BREADBOARD_GROUPS.slice(5)];

export class Breadboard extends ElectronicComponent {
    readonly type = "breadboard";

    constructor(id: string) {
        super(id, "Breadboard", breadboardTerminalIds.map(id => new Terminal(id, id, "bidirectional")));
    }

    getProperties() {
        return { rows: BREADBOARD_ROWS, connectedGroups: BREADBOARD_ROWS * HALVES.length, powerRails: BREADBOARD_RAILS.length };
    }

    // Each numbered row is two strips, a–e and f–j, split by the centre channel; each power rail runs the whole length.
    getConnectedTerminalGroups(): string[][] {
        const groups = Array.from({ length: BREADBOARD_ROWS }, (_, row) => HALVES.map(half => half.map(group => `${group}${row + 1}`))).flat();
        groups.push(...BREADBOARD_RAILS.map(rail => Array.from({ length: BREADBOARD_ROWS }, (_, row) => `${rail}${row + 1}`)));
        return groups;
    }
}

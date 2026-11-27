import { ElectronicComponent } from "../../core/ElectronicComponent.ts";
import { Terminal } from "../../core/Terminal.ts";

// A generic 16-pin package (DIP-16). Its pins are not joined inside and it has no logic: the solver ignores it,
// so only the wires around each pin change the circuit.
export class Microchip extends ElectronicComponent {
    readonly type: string = "microchip";

    constructor(id: string) {
        super(id, "Microchip", Array.from({ length: 16 }, (_, index) => new Terminal(`${index + 1}`, `Pin ${index + 1}`, "bidirectional")));
    }

    getProperties() {
        return { package: "DIP-16", pins: this.terminals.length };
    }
}

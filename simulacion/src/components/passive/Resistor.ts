import { ElectronicComponent } from "../../core/ElectronicComponent.ts";
import { Terminal } from "../../core/Terminal.ts";
import { positive } from "../../core/validation.ts";

export class Resistor extends ElectronicComponent {
    readonly type = "resistor";

    constructor(
        id: string,
        private resistance: number,
        public readonly tolerance = 5,
        public readonly ratedPower = 0.25
    ) {
        super(id, "Resistor", [
            new Terminal("1", "Terminal 1", "bidirectional"),
            new Terminal("2", "Terminal 2", "bidirectional")
        ]);

        this.resistance = positive(resistance, "resistance");
    }

    getResistance(): number {
        return this.resistance;
    }

    setResistance(value: number): void {
        this.resistance = positive(value, "resistance");
    }

    getProperties() {
        return {
            resistance: this.resistance,
            tolerance: this.tolerance,
            ratedPower: this.ratedPower
        };
    }
}
import { ElectronicComponent } from "../../core/ElectronicComponent.ts";
import { Terminal } from "../../core/Terminal.ts";
import { positive } from "../../core/validation.ts";

export class Resistor extends ElectronicComponent {
    readonly type = "resistor";
    readonly tolerance: number;
    readonly ratedPower: number;
    private resistance: number;

    constructor(
        id: string,
        resistance: number,
        tolerance = 5,
        ratedPower = 0.25
    ) {
        super(id, "Resistor", [
            new Terminal("1", "Terminal 1", "bidirectional"),
            new Terminal("2", "Terminal 2", "bidirectional")
        ]);

        this.tolerance = tolerance;
        this.ratedPower = ratedPower;
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
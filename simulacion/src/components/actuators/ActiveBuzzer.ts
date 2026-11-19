import { ElectronicComponent } from "../../core/ElectronicComponent.ts";
import { Terminal } from "../../core/Terminal.ts";
import { positive } from "../../core/validation.ts";

export class ActiveBuzzer extends ElectronicComponent {
    readonly type = "active-buzzer";
    readonly nominalVoltage: number;
    readonly nominalCurrent: number;

    constructor(
        id: string,
        nominalVoltage: number,
        nominalCurrent: number
    ) {
        super(id, "Active Buzzer", [
            new Terminal("+", "Positive", "positive"),
            new Terminal("-", "Negative", "negative")
        ]);

        this.nominalVoltage = nominalVoltage;
        this.nominalCurrent = nominalCurrent;

        positive(nominalVoltage, "nominalVoltage");
        positive(nominalCurrent, "nominalCurrent");
    }

    getProperties() {
        return {
            nominalVoltage: this.nominalVoltage,
            nominalCurrent: this.nominalCurrent
        };
    }
}
import { ElectronicComponent } from "../../core/ElectronicComponent.ts";
import { Terminal } from "../../core/Terminal.ts";
import { positive } from "../../core/validation.ts";

export class ActiveBuzzer extends ElectronicComponent {
    readonly type = "active-buzzer";

    constructor(
        id: string,
        public readonly nominalVoltage: number,
        public readonly nominalCurrent: number
    ) {
        super(id, "Active Buzzer", [
            new Terminal("+", "Positive", "positive"),
            new Terminal("-", "Negative", "negative")
        ]);

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
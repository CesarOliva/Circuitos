import { ElectronicComponent } from "../../core/ElectronicComponent.ts";
import { Terminal } from "../../core/Terminal.ts";
import { nonnegative, positive } from "../../core/validation.ts";

export class DCMotor extends ElectronicComponent {
    readonly type = "dc-motor";

    constructor(
        id: string,
        public readonly nominalVoltage: number,
        public readonly noLoadCurrent: number,
        public readonly noLoadRPM: number,
        public readonly stallCurrent?: number,
    ) {
        super(id, "DC Motor", [
            new Terminal("+", "Terminal +", "positive"),
            new Terminal("-", "Terminal -", "negative"),
        ]);

        positive(nominalVoltage, "nominalVoltage");
        nonnegative(noLoadCurrent, "noLoadCurrent");
        nonnegative(noLoadRPM, "noLoadRPM");

        if (stallCurrent !== undefined) {
            positive(stallCurrent, "stallCurrent");
            if (stallCurrent < noLoadCurrent) {
                throw new RangeError("stallCurrent must be >= noLoadCurrent");
            }
        }
    }

    getProperties() {
        return {
            nominalVoltage: this.nominalVoltage,
            noLoadCurrent: this.noLoadCurrent,
            noLoadRPM: this.noLoadRPM,
            stallCurrent: this.stallCurrent ?? null,
        };
    }
}
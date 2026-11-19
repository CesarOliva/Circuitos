import { ElectronicComponent } from "../../core/ElectronicComponent.ts";
import { Terminal } from "../../core/Terminal.ts";
import { nonnegative, positive } from "../../core/validation.ts";

export class DCMotor extends ElectronicComponent {
    readonly type = "dc-motor";
    readonly nominalVoltage: number;
    readonly noLoadCurrent: number;
    readonly noLoadRPM: number;
    readonly stallCurrent?: number;

    constructor(
        id: string,
        nominalVoltage: number,
        noLoadCurrent: number,
        noLoadRPM: number,
        stallCurrent?: number,
    ) {
        super(id, "DC Motor", [
            new Terminal("+", "Terminal +", "positive"),
            new Terminal("-", "Terminal -", "negative"),
        ]);

        this.nominalVoltage = nominalVoltage;
        this.noLoadCurrent = noLoadCurrent;
        this.noLoadRPM = noLoadRPM;
        this.stallCurrent = stallCurrent;

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
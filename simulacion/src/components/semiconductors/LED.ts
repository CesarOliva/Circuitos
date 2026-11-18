import { ElectronicComponent } from "../../core/ElectronicComponent.ts";
import { Terminal } from "../../core/Terminal.ts";
import { positive } from "../../core/validation.ts";

type LEDColor =
    | "red"
    | "green"
    | "blue"
    | "yellow"
    | "white";

export class LED extends ElectronicComponent {
    readonly type = "led";

    constructor(
        id: string,
        public readonly color: LEDColor,
        public readonly forwardVoltage: number,
        public readonly maxForwardCurrent: number
    ) {
        super(id, "LED", [
            new Terminal("A", "Anode", "anode"),
            new Terminal("K", "Cathode", "cathode")
        ]);

        positive(forwardVoltage, "forwardVoltage");
        positive(maxForwardCurrent, "maxForwardCurrent");
    }

    getProperties() {
        return {
            color: this.color,
            forwardVoltage: this.forwardVoltage,
            maxForwardCurrent: this.maxForwardCurrent
        };
    }
}
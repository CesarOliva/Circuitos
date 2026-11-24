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
    readonly color: LEDColor;
    readonly forwardVoltage: number;
    readonly maxForwardCurrent: number;

    constructor(
        id: string,
        color: LEDColor,
        forwardVoltage: number,
        maxForwardCurrent: number
    ) {
        super(id, "LED", [
            new Terminal("A", "Anode", "anode"),
            new Terminal("K", "Cathode", "cathode")
        ]);

        this.color = color;
        this.forwardVoltage = forwardVoltage;
        this.maxForwardCurrent = maxForwardCurrent;
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
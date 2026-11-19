import { ElectronicComponent } from "../../core/ElectronicComponent.ts";
import { Terminal } from "../../core/Terminal.ts";
import { finite, positive } from "../../core/validation.ts";

export class DCVoltageSource extends ElectronicComponent {
    readonly type = "dc-voltage-source";
    private _voltage: number;
    readonly maxCurrent: number;

    constructor(id: string, voltage: number, maxCurrent: number = Infinity) {
        super(id, "DC Voltage Source", [
            new Terminal("+", "Positive", "positive"),
            new Terminal("-", "Negative", "negative"),
        ]);

        this.maxCurrent = maxCurrent;
        this._voltage = finite(voltage, "voltage");

        if (maxCurrent !== Infinity) {
            positive(maxCurrent, "maxCurrent");
        }
    }

    get voltage(): number { 
        return this._voltage; 
    }

    set voltage(value: number) { 
        this._voltage = finite(value, "voltage"); 
    }

    getProperties() { 
        return { 
            voltage: this.voltage, 
            maxCurrent: this.maxCurrent 
        }; 
    }
}
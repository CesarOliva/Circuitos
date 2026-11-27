import { ElectronicComponent } from "../../core/ElectronicComponent.ts";
import { Terminal } from "../../core/Terminal.ts";
import { fraction, positive } from "../../core/validation.ts";

export class Potentiometer extends ElectronicComponent {
    readonly type = "potentiometer";
    private _position: number;
    readonly totalResistanceOhms: number;
    wiperOpen = false;

    constructor(id: string, totalResistanceOhms: number, position = 0.5) {
        super(id, "Potentiometer", [
            new Terminal("A", "End A", "bidirectional"),
            new Terminal("W", "Wiper", "wiper"),
            new Terminal("B", "End B", "bidirectional"),
        ]);

        this.totalResistanceOhms = totalResistanceOhms;
        positive(totalResistanceOhms, "totalResistanceOhms");

        this._position = fraction(position, "position");
    }

    get position(): number { 
        return this._position;
    }

    set position(value: number) {
        this._position = fraction(value, "position"); 
    }

    get resistanceAW(): number { 
        // shortcut: 1 TΩ approximates an open wiper until the solver supports floating terminals.
        return this.wiperOpen ? 1e12 : this.totalResistanceOhms * this.position;
    }

    get resistanceWB(): number { 
        return this.wiperOpen ? 1e12 : this.totalResistanceOhms * (1 - this.position);
    }

    getProperties() {
        return {
            totalResistanceOhms: this.totalResistanceOhms,
            position: this.position,
            resistanceAW: this.resistanceAW,
            resistanceWB: this.resistanceWB,
        };
    }
}

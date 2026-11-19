import { ElectronicComponent } from "../../core/ElectronicComponent.ts";
import { Terminal } from "../../core/Terminal.ts";
import { nonnegative, positive } from "../../core/validation.ts";

export class Capacitor extends ElectronicComponent {
    readonly type = "capacitor";
    readonly capacitanceFarads: number;
    readonly ratedVoltage: number;
    readonly polarized: boolean;
    readonly equivalentSeriesResistanceOhms: number;

    constructor(
        id: string,
        capacitanceFarads: number,
        ratedVoltage: number,
        polarized = false,
        equivalentSeriesResistanceOhms = 0,
    ) {
        super(id, "Capacitor", polarized
            ? [
                new Terminal("+", "Positive", "positive"),
                new Terminal("-", "Negative", "negative")
            ]
            : [
                new Terminal("1", "Terminal 1", "bidirectional"), 
                new Terminal("2", "Terminal 2", "bidirectional")
            ]
        );

        this.capacitanceFarads = capacitanceFarads;
        this.ratedVoltage = ratedVoltage;
        this.polarized = polarized;
        this.equivalentSeriesResistanceOhms = equivalentSeriesResistanceOhms;
        positive(capacitanceFarads, "capacitanceFarads");
        positive(ratedVoltage, "ratedVoltage");
        nonnegative(equivalentSeriesResistanceOhms, "equivalentSeriesResistanceOhms");
    }

    getProperties() {
        return {
            capacitanceFarads: this.capacitanceFarads,
            ratedVoltage: this.ratedVoltage,
            polarized: this.polarized,
            equivalentSeriesResistanceOhms: this.equivalentSeriesResistanceOhms,
        };
    }
}
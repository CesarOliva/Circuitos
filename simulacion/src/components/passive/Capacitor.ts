import { ElectronicComponent } from "../../core/ElectronicComponent.ts";
import { Terminal } from "../../core/Terminal.ts";
import { nonnegative, positive } from "../../core/validation.ts";

export class Capacitor extends ElectronicComponent {
    readonly type = "capacitor";

    constructor(
        id: string,
        public readonly capacitanceFarads: number,
        public readonly ratedVoltage: number,
        public readonly polarized = false,
        public readonly equivalentSeriesResistanceOhms = 0,
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
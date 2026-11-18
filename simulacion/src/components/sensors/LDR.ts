import { ElectronicComponent } from "../../core/ElectronicComponent.ts";
import { Terminal } from "../../core/Terminal.ts";
import { nonnegative, positive } from "../../core/validation.ts";

export class LDR extends ElectronicComponent {
    readonly type = "ldr";
    private _illuminanceLux: number;

    constructor(
        id: string,
        public readonly referenceResistanceOhms = 10_000,
        public readonly referenceLux = 10,
        public readonly gamma = 0.7,
        illuminanceLux = 10,
        public readonly minLux = 0.01,
    ) {
        super(id, "LDR", [
            new Terminal("1", "Terminal 1", "bidirectional"),
            new Terminal("2", "Terminal 2", "bidirectional"),
        ]);

        positive(referenceResistanceOhms, "referenceResistanceOhms");
        positive(referenceLux, "referenceLux");
        positive(gamma, "gamma");
        positive(minLux, "minLux");

        this._illuminanceLux = nonnegative(illuminanceLux, "illuminanceLux");
    }

    get illuminanceLux(): number { 
        return this._illuminanceLux; 
    }

    set illuminanceLux(value: number) {
        this._illuminanceLux = nonnegative(value, "illuminanceLux");
    }

    get resistanceOhms(): number {
        return this.referenceResistanceOhms * Math.pow(this.referenceLux / Math.max(this.illuminanceLux, this.minLux), this.gamma);
    }

    getProperties() {
        return {
            illuminanceLux: this.illuminanceLux,
            resistanceOhms: this.resistanceOhms,
            referenceResistanceOhms: this.referenceResistanceOhms,
            referenceLux: this.referenceLux,
            gamma: this.gamma,
        };
    }
}
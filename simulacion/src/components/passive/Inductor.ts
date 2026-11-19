import { ElectronicComponent } from "../../core/ElectronicComponent.ts";
import { Terminal } from "../../core/Terminal.ts";
import { nonnegative, positive } from "../../core/validation.ts";

export class Inductor extends ElectronicComponent {
    readonly type = "inductor";
    readonly inductanceHenries: number;
    readonly seriesResistanceOhms: number;
    readonly maxCurrentAmps?: number;

    constructor(
        id: string,
        inductanceHenries: number,
        seriesResistanceOhms = 0,
        maxCurrentAmps?: number,
    ) {
        super(id, "Inductor", [
            new Terminal("1", "Terminal 1", "bidirectional"),
            new Terminal("2", "Terminal 2", "bidirectional"),
        ]);

        this.inductanceHenries = inductanceHenries;
        this.seriesResistanceOhms = seriesResistanceOhms;
        this.maxCurrentAmps = maxCurrentAmps;
        positive(inductanceHenries, "inductanceHenries");
        nonnegative(seriesResistanceOhms, "seriesResistanceOhms");

        if (maxCurrentAmps !== undefined) {
            positive(maxCurrentAmps, "maxCurrentAmps")
        }
    }

    getProperties() {
        return {
            inductanceHenries: this.inductanceHenries,
            seriesResistanceOhms: this.seriesResistanceOhms,
            maxCurrentAmps: this.maxCurrentAmps ?? null,
        };
    }
}
import { ElectronicComponent } from "../../core/ElectronicComponent.ts";
import { Terminal } from "../../core/Terminal.ts";
import { positive } from "../../core/validation.ts";

export type BJTType = "NPN" | "PNP";

export class Transistor extends ElectronicComponent {
    readonly type = "transistor-bjt";

    constructor(
        id: string,
        public readonly polarity: BJTType,
        public readonly dcGainBeta: number,
        public readonly maxCollectorCurrent: number,
        public readonly maxCollectorEmitterVoltage: number,
        public readonly nominalBaseEmitterVoltage = 0.7,
    ) {
        super(id, "BJT Transistor", [
            new Terminal("B", "Base", "base"),
            new Terminal("C", "Collector", "collector"),
            new Terminal("E", "Emitter", "emitter"),
        ]);

        if (polarity !== "NPN" && polarity !== "PNP") {
            throw new Error("Invalid BJT polarity");
        }
        
        positive(dcGainBeta, "dcGainBeta");
        positive(maxCollectorCurrent, "maxCollectorCurrent");
        positive(maxCollectorEmitterVoltage, "maxCollectorEmitterVoltage");
        positive(nominalBaseEmitterVoltage, "nominalBaseEmitterVoltage");
    }

    getProperties() {
        return {
            polarity: this.polarity,
            dcGainBeta: this.dcGainBeta,
            maxCollectorCurrent: this.maxCollectorCurrent,
            maxCollectorEmitterVoltage: this.maxCollectorEmitterVoltage,
            nominalBaseEmitterVoltage: this.nominalBaseEmitterVoltage,
        };
    }
}
import { ElectronicComponent } from "../../core/ElectronicComponent.ts";
import { Terminal } from "../../core/Terminal.ts";
import { positive } from "../../core/validation.ts";

export type BJTType = "NPN" | "PNP";

export class Transistor extends ElectronicComponent {
    readonly type = "transistor-bjt";
    readonly polarity: BJTType;
    readonly dcGainBeta: number;
    readonly maxCollectorCurrent: number;
    readonly maxCollectorEmitterVoltage: number;
    readonly nominalBaseEmitterVoltage: number;

    constructor(
        id: string,
        polarity: BJTType,
        dcGainBeta: number,
        maxCollectorCurrent: number,
        maxCollectorEmitterVoltage: number,
        nominalBaseEmitterVoltage = 0.7,
    ) {
        super(id, "BJT Transistor", [
            new Terminal("B", "Base", "base"),
            new Terminal("C", "Collector", "collector"),
            new Terminal("E", "Emitter", "emitter"),
        ]);

        this.polarity = polarity;
        this.dcGainBeta = dcGainBeta;
        this.maxCollectorCurrent = maxCollectorCurrent;
        this.maxCollectorEmitterVoltage = maxCollectorEmitterVoltage;
        this.nominalBaseEmitterVoltage = nominalBaseEmitterVoltage;
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
import { ElectronicComponent } from "../../core/ElectronicComponent.ts";
import { Terminal } from "../../core/Terminal.ts";
import { nonnegative, positive } from "../../core/validation.ts";

export class UltrasonicSensor extends ElectronicComponent {
    readonly type = "ultrasonic";
    private _distanceCm: number;

    constructor(
        id: string,
        public readonly minDistanceCm = 2,
        public readonly maxDistanceCm = 400,
        distanceCm = 0,
    ) {
        super(id, "Ultrasonic Sensor", [
            new Terminal("VCC", "Power", "positive"),
            new Terminal("TRIG", "Trigger", "input"),
            new Terminal("ECHO", "Echo", "output"),
            new Terminal("GND", "Ground", "negative"),
        ]);

        positive(minDistanceCm, "minDistanceCm");
        positive(maxDistanceCm, "maxDistanceCm");

        this._distanceCm = nonnegative(distanceCm, "distanceCm");
    }

    get distanceCm(): number {
        return this._distanceCm;
    }

    set distanceCm(value: number) {
        this._distanceCm = nonnegative(value, "distanceCm");
    }

    getProperties() {
        return {
            distanceCm: this.distanceCm,
            minDistanceCm: this.minDistanceCm,
            maxDistanceCm: this.maxDistanceCm,
        };
    }
}
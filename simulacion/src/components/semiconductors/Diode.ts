import { ElectronicComponent } from "../../core/ElectronicComponent.ts";
import { Terminal } from "../../core/Terminal.ts";
import { positive } from "../../core/validation.ts";

export class Diode extends ElectronicComponent {
	readonly type = "diode";
	readonly nominalForwardVoltage: number;
	readonly maxForwardCurrent: number;
	readonly maxReverseVoltage: number;

	constructor(
		id: string,
		nominalForwardVoltage = 0.7,
		maxForwardCurrent = 1,
		maxReverseVoltage = 50,
	) {
		super(id, "Diode", [
			new Terminal("A", "Anode", "anode"),
			new Terminal("K", "Cathode", "cathode"),
		]);

		this.nominalForwardVoltage = nominalForwardVoltage;
		this.maxForwardCurrent = maxForwardCurrent;
		this.maxReverseVoltage = maxReverseVoltage;
		positive(nominalForwardVoltage, "nominalForwardVoltage");
		positive(maxForwardCurrent, "maxForwardCurrent");
		positive(maxReverseVoltage, "maxReverseVoltage");
	}

	getProperties() {
		return {
			nominalForwardVoltage: this.nominalForwardVoltage,
			maxForwardCurrent: this.maxForwardCurrent,
			maxReverseVoltage: this.maxReverseVoltage,
		};
	}
}
import { ElectronicComponent } from "../../core/ElectronicComponent.ts";
import { Terminal } from "../../core/Terminal.ts";
import { positive } from "../../core/validation.ts";

export class Diode extends ElectronicComponent {
	readonly type = "diode";

	constructor(
		id: string,
		public readonly nominalForwardVoltage = 0.7,
		public readonly maxForwardCurrent = 1,
		public readonly maxReverseVoltage = 50,
	) {
		super(id, "Diode", [
			new Terminal("A", "Anode", "anode"),
			new Terminal("K", "Cathode", "cathode"),
		]);
		
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
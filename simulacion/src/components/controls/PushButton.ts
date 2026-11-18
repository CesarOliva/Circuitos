import { ElectronicComponent } from "../../core/ElectronicComponent.ts";
import { Terminal } from "../../core/Terminal.ts";

export type PushButtonContact = "NO" | "NC";

export class PushButton extends ElectronicComponent {
    readonly type = "push-button";
    private _pressed = false;

    constructor(id: string, public readonly contact: PushButtonContact = "NO") {
		super(id, "Push Button", [
			new Terminal("1", "Terminal 1", "bidirectional"),
			new Terminal("2", "Terminal 2", "bidirectional"),
		]);

      	if (contact !== "NO" && contact !== "NC") {
            throw new Error("Invalid contact type")
        }
    }

    get pressed(): boolean { 
        return this._pressed; 
    }

    get closed(): boolean {
        return this.contact === "NO" ? this.pressed : !this.pressed; 
    }

    press(): void { 
        this._pressed = true; 
    }

    release(): void { 
        this._pressed = false; 
    }

    getProperties() { 
        return { 
            contact: this.contact, 
            pressed: this.pressed, 
            closed: this.closed 
        }
    }
}
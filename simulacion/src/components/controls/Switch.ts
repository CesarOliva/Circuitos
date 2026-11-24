import { ElectronicComponent } from "../../core/ElectronicComponent.ts";
import { Terminal } from "../../core/Terminal.ts";

export class Switch extends ElectronicComponent {
    readonly type: string = "switch";
    private _closed: boolean;

    constructor(id: string, closed = false) {
        super(id, "Switch", [
            new Terminal("1", "Terminal 1", "bidirectional"),
            new Terminal("2", "Terminal 2", "bidirectional"),
        ]);

        this._closed = closed;
    }

    get closed(): boolean { 
        return this._closed;
    }

    set closed(value: boolean) { 
        this._closed = value;
    }

    toggle(): void { 
        this._closed = !this._closed; 
    }

    getProperties() { 
        return { 
            closed: this.closed 
        }; 
    }
}
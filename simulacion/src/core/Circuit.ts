import { Connection } from "./Connection.ts";
import { ElectronicComponent } from "./ElectronicComponent.ts"
import { Node, type TerminalReference } from "./Node.ts";

export class Circuit {
    private components = new Map<string, ElectronicComponent>();
    private connections = new Map<string, Connection>();
    readonly id: string;
    readonly name: string;

    constructor (
        id: string,
        name: string
    ) {
        this.id = id;
        this.name = name;
    }

    addComponent(component: ElectronicComponent): void {
        if (this.components.has(component.id)) {
            throw new Error(`Component ${component.id} already exists`);
        }

        this.components.set(component.id, component);
    }

    removeComponent(id: string): void {
        if (!this.components.has(id)) {
            throw new Error(`Component ${id} not found`);
        }

        this.components.delete(id);

        for (const connection of this.connections.values()) {
            if (connection.involvesComponent(id)) {
                this.connections.delete(connection.id);
            }
        }
    }

    getComponent(id: string): ElectronicComponent | undefined {
        return this.components.get(id);
    }

    getComponents(): ElectronicComponent[] {
        return [...this.components.values()];
    }

    addConnection(connection: Connection): void {
        if (this.connections.has(connection.id)) {
            throw new Error(`Connection ${connection.id} already exists`);
        }

        this.validateTerminal(connection.from);
        this.validateTerminal(connection.to);

        const key = (t: TerminalReference) => 
            JSON.stringify([t.componentId, t.terminalId]);

        const a = key(connection.from);
        const b = key(connection.to);

        const duplicate = [...this.connections.values()].some(c => {
            const x = key(c.from);
            const y = key(c.to);

            return (a === x && b === y) || (a === y && b === x);
        });

        if (duplicate) {
            throw new Error("Connection already exists");
        }

        this.connections.set(connection.id, connection);
    }

    removeConnection(id: string): void {
        if (!this.connections.delete(id)) {
            throw new Error(`Connection ${id} not found`);
        }
    }

    getConnections(): Connection[] {
        return [...this.connections.values()];
    }

    private validateTerminal(ref: TerminalReference): void {
        const component = this.components.get(ref.componentId);

        if (!component) {
            throw new Error(`Component ${ref.componentId} not found`);
        }

        if (!component.getTerminal(ref.terminalId)) {
            throw new Error(
                `Terminal ${ref.terminalId} not found in ${ref.componentId}`
            );
        }
    }

    getNodes(): Node[] {
        const refs = new Map<string, TerminalReference>();
        const parent = new Map<string, string>();

        const key = (t: TerminalReference) =>
            JSON.stringify([t.componentId, t.terminalId]);

        for (const component of this.components.values()) {
            for (const terminal of component.terminals) {
                const ref = {
                    componentId: component.id,
                    terminalId: terminal.id
                };

                const id = key(ref);
                refs.set(id, ref);
                parent.set(id, id);
            }
        }

    const find = (id: string): string => {
        const p = parent.get(id);

        if (p === undefined) {
            throw new Error(`Unknown terminal ${id}`);
        }

        if (p === id) return id;

        const root = find(p);
        parent.set(id, root);

        return root;
    };

    const union = (a: string, b: string): void => {
        const rootA = find(a);
        const rootB = find(b);

        if (rootA !== rootB) {
            const [first, second] =
                rootA < rootB
                    ? [rootA, rootB]
                    : [rootB, rootA];

            parent.set(second, first);
        }
        };

        for (const connection of this.connections.values()) {
            union(key(connection.from), key(connection.to));
        }

        const groups = new Map<string, TerminalReference[]>();

        for (const [id, ref] of refs) {
            const root = find(id);

            if (!groups.has(root)) {
                groups.set(root, []);
            }

            groups.get(root)!.push(ref);
        }

        return [...groups.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([id, terminals]) => new Node(id, terminals));
  }

    getNodeOfTerminal(
        componentId: string,
        terminalId: string
    ): Node | undefined {
        return this.getNodes().find(node =>
            node.hasTerminal(componentId, terminalId)
        );
    }
}

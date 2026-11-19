
import { Circuit } from "../core/Circuit.ts";
import { Resistor } from "../components/passive/Resistor.ts";
import { DCVoltageSource } from "../components/sources/DCVoltageSource.ts";
import { LinearSystemSolver } from "./LinearSystemSolver.ts";
import type { SimulationResult, ComponentResult } from "./SimulationResult.ts";

export class DCSolver {
    simulate(circuit: Circuit): SimulationResult {
        try {
            return this.solve(circuit);
        } catch (error) {
            return {
                success: false,
                nodes: [],
                components: [],
                errors: [
                error instanceof Error
                    ? error.message
                    : String(error)
                ]
            };
        }
    }

    private solve(circuit: Circuit): SimulationResult {
        const components = circuit.getComponents();
        const nodes = circuit.getNodes();

        if (components.length === 0) {
            throw new Error("Circuit is empty");
        }

        const resistors: Resistor[] = [];
        const sources: DCVoltageSource[] = [];

        for (const component of components) {
            if (component instanceof Resistor) {
                resistors.push(component);
            } else if (component instanceof DCVoltageSource) {
                sources.push(component);
            } else {
                throw new Error(`Unsupported component: ${component.id} (${component.type})`);
            }
        }

        if (sources.length === 0) {
            throw new Error("At least one DC source is required");
        }

        const terminalToNode = new Map<string, string>();

        const terminalKey = (
            componentId: string,
            terminalId: string
        ) => JSON.stringify([componentId, terminalId]);

        for (const node of nodes) {
            for (const terminal of node.terminals) {
                terminalToNode.set(
                    terminalKey(
                        terminal.componentId,
                        terminal.terminalId
                    ),
                    node.id
                );
            }
        }

        const getNode = (
            componentId: string,
            terminalId: string
        ): string => {
            const id = terminalToNode.get(terminalKey(componentId, terminalId));

            if (id === undefined) {
                throw new Error(`Node not found for ${componentId}:${terminalId}`);
            }

            return id;
        };

        const groundId = getNode(sources[0]!.id, "-");

        const nonGroundNodes = nodes.filter(
            node => node.id !== groundId
        );

        const nodeIndex = new Map<string, number>();

        nonGroundNodes.forEach((node, index) => {
            nodeIndex.set(node.id, index);
        });

        const N = nonGroundNodes.length;
        const M = sources.length;
        const size = N + M;

        const A = Array.from(
            { length: size },
            () => Array<number>(size).fill(0)
        );

        const b = Array<number>(size).fill(0);

        const indexOf = (nodeId: string): number => {
            return nodeId === groundId ? -1 : (nodeIndex.get(nodeId) ?? -1);
        };

        for (const resistor of resistors) {
            const a = indexOf(getNode(resistor.id, "1"));
            const c = indexOf(getNode(resistor.id, "2"));
            const R = resistor.getResistance();

            if (!Number.isFinite(R) || R <= 0) {
                throw new Error(
                `Invalid resistance in ${resistor.id}`
                );
            }

            const G = 1 / R;

            if (a >= 0) A[a]![a] = A[a]![a]! + G;
            if (c >= 0) A[c]![c] = A[c]![c]! + G;

            if (a >= 0 && c >= 0) {
                A[a]![c] = A[a]![c]! - G;
                A[c]![a] = A[c]![a]! - G;
            }
        }

        for (let k = 0; k < M; k++) {
            const source = sources[k]!;

            const positive = indexOf(
                getNode(source.id, "+")
            );

            const negative = indexOf(
                getNode(source.id, "-")
            );

            const sourceCurrentIndex = N + k;

            if (positive >= 0) {
                A[positive]![sourceCurrentIndex] = A[positive]![sourceCurrentIndex]! + 1;
                A[sourceCurrentIndex]![positive] = A[sourceCurrentIndex]![positive]! + 1;
            }

            if (negative >= 0) {
                A[negative]![sourceCurrentIndex] = A[negative]![sourceCurrentIndex]! - 1;
                A[sourceCurrentIndex]![negative] = A[sourceCurrentIndex]![negative]! - 1;
            }

            b[sourceCurrentIndex] = source.getVoltage();
        }

        const solution = LinearSystemSolver.solve(A, b);

        const voltageOf = (nodeId: string): number => {
            if (nodeId === groundId) return 0;

            const index = nodeIndex.get(nodeId);

            if (index === undefined) {
                throw new Error(`Unknown node ${nodeId}`);
            }

            return solution[index]!;
        };

        const nodeResults = nodes.map(node => ({
            nodeId: node.id,
            voltage: voltageOf(node.id)
        }));

        const componentResults: ComponentResult[] = [];

        for (const resistor of resistors) {
            const va = voltageOf(getNode(resistor.id, "1"));
            const vb = voltageOf(getNode(resistor.id, "2"));

            const voltage = va - vb;
            const current = voltage / resistor.getResistance();
            const power = voltage * current;

            componentResults.push({
                componentId: resistor.id,
                type: resistor.type,
                voltage,
                current,
                power
            });
        }

        for (let k = 0; k < M; k++) {
            const source = sources[k]!;

            const voltage = voltageOf(getNode(source.id, "+")) - voltageOf(getNode(source.id, "-"));

            const current = solution[N + k]!;

            componentResults.push({
                componentId: source.id,
                type: source.type,
                voltage,
                current,
                power: voltage * current
            });
        }

        return {
            success: true,
            nodes: nodeResults,
            components: componentResults,
            errors: []
        };
    }
}

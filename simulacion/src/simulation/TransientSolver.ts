import { Circuit } from "../core/Circuit.ts";
import { DCVoltageSource } from "../components/sources/DCVoltageSource.ts";
import { Resistor } from "../components/passive/Resistor.ts";
import { Capacitor } from "../components/passive/Capacitor.ts";
import { Inductor } from "../components/passive/Inductor.ts";
import { solveNetwork, type ConductanceBranch, type VoltageConstraint } from "./MnaSolver.ts";
import type { ComponentResult, NodeResult } from "./SimulationResult.ts";

export interface TransientOptions {
    durationSeconds: number;
    timeStepSeconds: number;
}

export interface TransientSample {
    timeSeconds: number;
    nodes: NodeResult[];
    components: ComponentResult[];
}

export interface TransientSimulationResult {
    success: boolean;
    samples: TransientSample[];
    errors: string[];
}

export class TransientSolver {
    simulate(circuit: Circuit, options: TransientOptions): TransientSimulationResult {
        try {
            return { success: true, samples: this.solve(circuit, options), errors: [] };
        } catch (error) {
            return { success: false, samples: [], errors: [error instanceof Error ? error.message : String(error)] };
        }
    }

    private solve(circuit: Circuit, options: TransientOptions): TransientSample[] {
        const { durationSeconds, timeStepSeconds } = options;
        if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 ||
            !Number.isFinite(timeStepSeconds) || timeStepSeconds <= 0) {
            throw new Error("Duration and time step must be finite positive values");
        }
        const stepCount = Math.ceil(durationSeconds / timeStepSeconds);
        if (!Number.isSafeInteger(stepCount) || stepCount > 100_000) {
            throw new Error("Transient analysis is limited to 100000 time steps");
        }
        const components = circuit.getComponents();
        const originalNodes = circuit.getNodes();
        const sources = components.filter((component): component is DCVoltageSource => component instanceof DCVoltageSource);
        if (components.length === 0) throw new Error("Circuit is empty");
        if (sources.length === 0) throw new Error("At least one DC source is required");
        for (const component of components) {
            if (!(component instanceof DCVoltageSource || component instanceof Resistor || component instanceof Capacitor || component instanceof Inductor)) {
                throw new Error(`Unsupported component in transient analysis: ${component.id} (${component.type})`);
            }
        }

        const terminalNode = new Map<string, string>();
        const key = (componentId: string, terminalId: string) => JSON.stringify([componentId, terminalId]);
        for (const node of originalNodes) for (const terminal of node.terminals) terminalNode.set(key(terminal.componentId, terminal.terminalId), node.id);
        const getNode = (componentId: string, terminalId: string): string => {
            const node = terminalNode.get(key(componentId, terminalId));
            if (node === undefined) throw new Error(`Node not found for ${componentId}:${terminalId}`);
            return node;
        };
        const nodes = originalNodes.map(node => node.id);
        const groundId = getNode(sources[0]!.id, "-");
        const constraints: VoltageConstraint[] = sources.map(source => ({
            id: source.id,
            positive: getNode(source.id, "+"),
            negative: getNode(source.id, "-"),
            voltage: source.getVoltage(),
        }));
        const capacitorVoltage = new Map<string, number>(components.filter((item): item is Capacitor => item instanceof Capacitor).map(item => [item.id, 0]));
        const inductorCurrent = new Map<string, number>(components.filter((item): item is Inductor => item instanceof Inductor).map(item => [item.id, 0]));
        const samples: TransientSample[] = [];
        let time = 0;

        for (let step = 0; step < stepCount; step++) {
            const dt = Math.min(timeStepSeconds, durationSeconds - time);
            const branches: ConductanceBranch[] = [];
            for (const component of components) {
                if (component instanceof Resistor) {
                    branches.push({ id: component.id, positive: getNode(component.id, "1"), negative: getNode(component.id, "2"), conductance: 1 / component.getResistance() });
                } else if (component instanceof Capacitor) {
                    const terminalA = component.polarized ? "+" : "1";
                    const terminalB = component.polarized ? "-" : "2";
                    const g = 1 / (component.equivalentSeriesResistanceOhms + dt / component.capacitanceFarads);
                    branches.push({ id: component.id, positive: getNode(component.id, terminalA), negative: getNode(component.id, terminalB), conductance: g, currentOffset: -g * capacitorVoltage.get(component.id)! });
                } else if (component instanceof Inductor) {
                    const inductiveResistance = component.inductanceHenries / dt;
                    const resistance = component.seriesResistanceOhms + inductiveResistance;
                    const g = 1 / resistance;
                    branches.push({ id: component.id, positive: getNode(component.id, "1"), negative: getNode(component.id, "2"), conductance: g, currentOffset: inductiveResistance * inductorCurrent.get(component.id)! * g });
                }
            }

            const solution = solveNetwork(nodes, groundId, branches, constraints);
            const nodeResults = originalNodes.map(node => ({ nodeId: node.id, voltage: solution.voltage(node.id) }));
            const componentResults = components.map(component => {
                let positive: string;
                let negative: string;
                if (component instanceof DCVoltageSource) { positive = "+"; negative = "-"; }
                else { positive = component.terminals[0]!.id; negative = component.terminals[1]!.id; }
                const voltage = solution.voltage(getNode(component.id, positive)) - solution.voltage(getNode(component.id, negative));
                const branch = branches.find(item => item.id === component.id);
                const current = component instanceof DCVoltageSource ? solution.voltageSourceCurrent(component.id) : branch ? solution.branchCurrent(branch) : 0;
                if (component instanceof Capacitor) capacitorVoltage.set(component.id, voltage - component.equivalentSeriesResistanceOhms * current);
                if (component instanceof Inductor) inductorCurrent.set(component.id, current);
                const measurements: Record<string, number | boolean> = {};
                if (component instanceof Resistor) measurements.ratedPowerExceeded = Math.abs(voltage * current) > component.ratedPower;
                if (component instanceof DCVoltageSource) measurements.maxCurrentExceeded = Math.abs(current) > component.maxCurrent;
                if (component instanceof Capacitor) measurements.ratedVoltageExceeded = Math.abs(voltage) > component.ratedVoltage;
                if (component instanceof Inductor && component.maxCurrentAmps !== undefined) measurements.maxCurrentExceeded = Math.abs(current) > component.maxCurrentAmps;
                return { componentId: component.id, type: component.type, voltage, current, power: voltage * current, ...(Object.keys(measurements).length ? { measurements } : {}) };
            });
            time = Math.min(durationSeconds, time + dt);
            samples.push({ timeSeconds: time, nodes: nodeResults, components: componentResults });
        }
        return samples;
    }
}
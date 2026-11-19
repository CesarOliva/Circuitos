import { Circuit } from "../core/Circuit.ts";
import { DCVoltageSource } from "../components/sources/DCVoltageSource.ts";
import { Resistor } from "../components/passive/Resistor.ts";
import { Capacitor } from "../components/passive/Capacitor.ts";
import { Inductor } from "../components/passive/Inductor.ts";
import { LDR } from "../components/sensors/LDR.ts";
import { UltrasonicSensor } from "../components/sensors/UltrasonicSensor.ts";
import { Potentiometer } from "../components/controls/Potentiometer.ts";
import { PushButton } from "../components/controls/PushButton.ts";
import { Switch } from "../components/controls/Switch.ts";
import { Diode } from "../components/semiconductors/Diode.ts";
import { LED } from "../components/semiconductors/LED.ts";
import { Transistor } from "../components/semiconductors/Transistor.ts";
import { DCMotor } from "../components/actuators/DCMotor.ts";
import { ActiveBuzzer } from "../components/actuators/ActiveBuzzer.ts";
import { solveNetwork, type ConductanceBranch, type VoltageConstraint } from "./MnaSolver.ts";
import type { SimulationResult, ComponentResult } from "./SimulationResult.ts";

const MIN_CONDUCTANCE = 1e-12;
const ON_RESISTANCE = 1e-3;

export class DCSolver {
    simulate(circuit: Circuit): SimulationResult {
        try {
            return this.solve(circuit);
        } catch (error) {
            return {
                success: false,
                nodes: [],
                components: [],
                errors: [error instanceof Error ? error.message : String(error)],
            };
        }
    }

    private solve(circuit: Circuit): SimulationResult {
        const components = circuit.getComponents();
        const originalNodes = circuit.getNodes();
        if (components.length === 0) throw new Error("Circuit is empty");

        const terminalNode = new Map<string, string>();
        const key = (componentId: string, terminalId: string) => JSON.stringify([componentId, terminalId]);
        for (const node of originalNodes) {
            for (const terminal of node.terminals) terminalNode.set(key(terminal.componentId, terminal.terminalId), node.id);
        }
        const getNode = (componentId: string, terminalId: string): string => {
            const node = terminalNode.get(key(componentId, terminalId));
            if (node === undefined) throw new Error(`Node not found for ${componentId}:${terminalId}`);
            return node;
        };

        const parents = new Map(originalNodes.map(node => [node.id, node.id]));
        const find = (id: string): string => {
            const parent = parents.get(id);
            if (parent === undefined) throw new Error(`Unknown node ${id}`);
            if (parent === id) return id;
            const root = find(parent);
            parents.set(id, root);
            return root;
        };
        const idealConstraints: VoltageConstraint[] = [];
        const idealConstraintByComponent = new Map<string, string>();
        const addIdealConnection = (componentId: string, terminalA: string, terminalB: string) => {
            const positive = getNode(componentId, terminalA);
            const negative = getNode(componentId, terminalB);
            const rootA = find(positive);
            const rootB = find(negative);
            if (rootA === rootB) return;
            const id = JSON.stringify([componentId, "ideal-connection", terminalA, terminalB]);
            idealConstraints.push({ id, positive, negative, voltage: 0 });
            idealConstraintByComponent.set(componentId, id);
            parents.set(rootB, rootA);
        };

        for (const component of components) {
            if ((component instanceof Switch && component.closed) || (component instanceof PushButton && component.closed)) {
                addIdealConnection(component.id, "1", "2");
            } else if (component instanceof Potentiometer) {
                if (component.resistanceAW === 0) addIdealConnection(component.id, "A", "W");
                if (component.resistanceWB === 0) addIdealConnection(component.id, "W", "B");
            } else if (component instanceof Inductor && component.seriesResistanceOhms === 0) {
                addIdealConnection(component.id, "1", "2");
            }
        }

        const nodeOf = (id: string) => { find(id); return id; };
        const sourceComponents = components.filter((component): component is DCVoltageSource => component instanceof DCVoltageSource);
        if (sourceComponents.length === 0) throw new Error("At least one DC source is required");
        const groundId = getNode(sourceComponents[0]!.id, "-");
        const nodes = originalNodes.map(node => node.id);
        const branches: ConductanceBranch[] = [];
        const constraints: VoltageConstraint[] = [];
        const componentBranches = new Map<string, ConductanceBranch[]>();
        const addBranch = (componentId: string, positive: string, negative: string, resistance: number) => {
            if (!Number.isFinite(resistance) || resistance <= 0) throw new Error(`Invalid resistance in ${componentId}`);
            const branch: ConductanceBranch = { id: componentId, positive: nodeOf(positive), negative: nodeOf(negative), conductance: 1 / resistance };
            branches.push(branch);
            const list = componentBranches.get(componentId) ?? [];
            list.push(branch);
            componentBranches.set(componentId, list);
        };

        constraints.push(...idealConstraints);
        for (const source of sourceComponents) {
            constraints.push({ id: source.id, positive: nodeOf(getNode(source.id, "+")), negative: nodeOf(getNode(source.id, "-")), voltage: source.getVoltage() });
        }

        const nonlinear: Array<{ componentId: string; positive: string; negative: string; threshold: number; kind: "diode" | "transistor" }> = [];
        const transistors: Transistor[] = [];
        const sensors: UltrasonicSensor[] = [];
        for (const component of components) {
            if (component instanceof Resistor) {
                addBranch(component.id, getNode(component.id, "1"), getNode(component.id, "2"), component.getResistance());
            } else if (component instanceof LDR) {
                addBranch(component.id, getNode(component.id, "1"), getNode(component.id, "2"), component.resistanceOhms);
            } else if (component instanceof Potentiometer) {
                if (component.resistanceAW > 0) addBranch(component.id, getNode(component.id, "A"), getNode(component.id, "W"), component.resistanceAW);
                if (component.resistanceWB > 0) addBranch(component.id, getNode(component.id, "W"), getNode(component.id, "B"), component.resistanceWB);
            } else if (component instanceof Inductor && component.seriesResistanceOhms > 0) {
                addBranch(component.id, getNode(component.id, "1"), getNode(component.id, "2"), component.seriesResistanceOhms);
            } else if (component instanceof ActiveBuzzer) {
                addBranch(component.id, getNode(component.id, "+"), getNode(component.id, "-"), component.nominalVoltage / component.nominalCurrent);
            } else if (component instanceof DCMotor) {
                const current = Math.max(component.noLoadCurrent, 1e-6);
                addBranch(component.id, getNode(component.id, "+"), getNode(component.id, "-"), component.nominalVoltage / current);
            } else if (component instanceof Diode) {
                nonlinear.push({ componentId: component.id, positive: nodeOf(getNode(component.id, "A")), negative: nodeOf(getNode(component.id, "K")), threshold: component.nominalForwardVoltage, kind: "diode" });
            } else if (component instanceof LED) {
                nonlinear.push({ componentId: component.id, positive: nodeOf(getNode(component.id, "A")), negative: nodeOf(getNode(component.id, "K")), threshold: component.forwardVoltage, kind: "diode" });
            } else if (component instanceof Transistor) {
                transistors.push(component);
                const base = getNode(component.id, "B");
                const emitter = getNode(component.id, "E");
                nonlinear.push({ componentId: `${component.id}:BE`, positive: nodeOf(component.polarity === "NPN" ? base : emitter), negative: nodeOf(component.polarity === "NPN" ? emitter : base), threshold: component.nominalBaseEmitterVoltage, kind: "transistor" });
            } else if (component instanceof UltrasonicSensor) {
                sensors.push(component);
            } else if (component instanceof Capacitor || component instanceof Switch || component instanceof PushButton) {
                // Capacitors are open circuits in steady-state DC; switches are handled as ideal shorts above.
            } else if (component.type !== "dc-voltage-source") {
                throw new Error(`Unsupported component: ${component.id} (${component.type})`);
            }
        }

        let activeDiodes = new Set<string>();
        let activeTransistors = new Set<string>();
        let activeSensors = new Set<string>();
        let transistorConductances = new Map<string, number>();
        const sensorHighVoltage = new Map(sensors.map(sensor => [sensor.id, 0]));
        let solution: ReturnType<typeof solveNetwork> | undefined;
        let finalBranches: ConductanceBranch[] = [];
        for (let iteration = 0; iteration < 30; iteration++) {
            const currentBranches = [...branches];
            for (const diode of nonlinear) {
                const transistorId = diode.kind === "transistor" ? diode.componentId.slice(0, -3) : undefined;
                const on = transistorId ? activeTransistors.has(transistorId) : activeDiodes.has(diode.componentId);
                const conductance = on ? 1 / ON_RESISTANCE : MIN_CONDUCTANCE;
                currentBranches.push({
                    id: diode.componentId,
                    positive: diode.positive,
                    negative: diode.negative,
                    conductance,
                    currentOffset: on ? -conductance * diode.threshold : 0,
                });
            }
            for (const transistor of transistors) {
                if (!activeTransistors.has(transistor.id)) continue;
                const collector = nodeOf(getNode(transistor.id, "C"));
                const emitter = nodeOf(getNode(transistor.id, "E"));
                const forward = transistor.polarity === "NPN";
                currentBranches.push({
                    id: `${transistor.id}:CE`,
                    positive: forward ? collector : emitter,
                    negative: forward ? emitter : collector,
                    conductance: transistorConductances.get(transistor.id) ?? MIN_CONDUCTANCE,
                });
            }
            const currentConstraints = [...constraints];
            for (const sensor of sensors) {
                currentConstraints.push({
                    id: JSON.stringify([sensor.id, "echo"]),
                    positive: nodeOf(getNode(sensor.id, "ECHO")),
                    negative: nodeOf(getNode(sensor.id, "GND")),
                    voltage: activeSensors.has(sensor.id) ? sensorHighVoltage.get(sensor.id)! : 0,
                });
            }
            solution = solveNetwork(nodes, groundId, currentBranches, currentConstraints);
            finalBranches = currentBranches;
            for (const sensor of sensors) {
                sensorHighVoltage.set(sensor.id, solution.voltage(nodeOf(getNode(sensor.id, "VCC"))) - solution.voltage(nodeOf(getNode(sensor.id, "GND"))));
            }
            const nextDiodes = new Set(nonlinear.filter(device => device.kind === "diode" && solution!.voltage(device.positive) - solution!.voltage(device.negative) >= device.threshold).map(device => device.componentId));
            const nextTransistors = new Set(transistors.filter(transistor => {
                const base = nodeOf(getNode(transistor.id, "B"));
                const emitter = nodeOf(getNode(transistor.id, "E"));
                const vbe = transistor.polarity === "NPN" ? solution!.voltage(base) - solution!.voltage(emitter) : solution!.voltage(emitter) - solution!.voltage(base);
                return vbe >= transistor.nominalBaseEmitterVoltage;
            }).map(transistor => transistor.id));
            const nextSensors = new Set(sensors.filter(sensor => {
                const trigger = solution!.voltage(nodeOf(getNode(sensor.id, "TRIG")));
                return trigger >= 2.5 && sensor.distanceCm >= sensor.minDistanceCm && sensor.distanceCm <= sensor.maxDistanceCm;
            }).map(sensor => sensor.id));
            const nextTransistorConductances = new Map<string, number>();
            for (const transistor of transistors) {
                if (!nextTransistors.has(transistor.id)) continue;
                const base = nodeOf(getNode(transistor.id, "B"));
                const emitter = nodeOf(getNode(transistor.id, "E"));
                const forward = transistor.polarity === "NPN";
                const vbe = forward ? solution.voltage(base) - solution.voltage(emitter) : solution.voltage(emitter) - solution.voltage(base);
                const baseCurrent = Math.max(0, (vbe - transistor.nominalBaseEmitterVoltage) / ON_RESISTANCE);
                const targetCurrent = Math.min(transistor.maxCollectorCurrent, transistor.dcGainBeta * baseCurrent);
                nextTransistorConductances.set(transistor.id, targetCurrent / transistor.maxCollectorEmitterVoltage);
            }
            const conductancesStable = [...nextTransistorConductances].every(([id, conductance]) => {
                const previous = transistorConductances.get(id) ?? MIN_CONDUCTANCE;
                return Math.abs(conductance - previous) <= 1e-6 * Math.max(Math.abs(conductance), Math.abs(previous), MIN_CONDUCTANCE);
            }) &&
                [...transistorConductances.keys()].every(id => nextTransistorConductances.has(id));
            const stable = sameSet(activeDiodes, nextDiodes) && sameSet(activeTransistors, nextTransistors) && sameSet(activeSensors, nextSensors) && conductancesStable;
            activeDiodes = nextDiodes;
            activeTransistors = nextTransistors;
            activeSensors = nextSensors;
            transistorConductances = nextTransistorConductances;
            if (stable) break;
            if (iteration === 29) throw new Error("Nonlinear circuit did not converge");
        }
        if (!solution) throw new Error("Circuit could not be solved");

        const voltageOf = (componentId: string, terminalId: string) => solution!.voltage(nodeOf(getNode(componentId, terminalId)));
        const componentResults: ComponentResult[] = components.map(component => {
            let positive: string;
            let negative: string;
            if (component instanceof DCVoltageSource || component instanceof DCMotor || component instanceof ActiveBuzzer) {
                positive = "+"; negative = "-";
            } else if (component instanceof Diode || component instanceof LED) {
                positive = "A"; negative = "K";
            } else if (component instanceof Transistor) {
                positive = component.polarity === "NPN" ? "C" : "E"; negative = component.polarity === "NPN" ? "E" : "C";
            } else if (component instanceof UltrasonicSensor) {
                positive = "ECHO"; negative = "GND";
            } else if (component instanceof Potentiometer) {
                positive = "A"; negative = "B";
            } else {
                positive = "1"; negative = "2";
            }
            const voltage = voltageOf(component.id, positive) - voltageOf(component.id, negative);
            const branchesForComponent = componentBranches.get(component.id) ?? [];
            let current = branchesForComponent.length ? solution!.branchCurrent(branchesForComponent[0]!) : 0;
            if (component instanceof DCVoltageSource) current = solution!.voltageSourceCurrent(component.id);
            else if (component instanceof Switch || component instanceof PushButton || (component instanceof Inductor && component.seriesResistanceOhms === 0)) {
                const constraintId = idealConstraintByComponent.get(component.id);
                current = constraintId ? solution!.voltageSourceCurrent(constraintId) : 0;
            }
            else if (component instanceof Diode || component instanceof LED) {
                const branch = nonlinear.find(item => item.componentId === component.id)!;
                const isOn = activeDiodes.has(component.id);
                current = isOn ? (voltage - branch.threshold) / ON_RESISTANCE : 0;
            } else if (component instanceof Transistor) {
                const collectorBranch = finalBranches.find(branch => branch.id === `${component.id}:CE`);
                current = collectorBranch ? solution!.branchCurrent(collectorBranch) : 0;
            }
            const measurements: Record<string, number | boolean> = {};
            if (component instanceof Resistor) {
                measurements.ratedPowerExceeded = Math.abs(voltage * current) > component.ratedPower;
            } else if (component instanceof DCVoltageSource) {
                measurements.maxCurrentExceeded = Math.abs(current) > component.maxCurrent;
            } else if (component instanceof Diode) {
                measurements.maxForwardCurrentExceeded = current > component.maxForwardCurrent;
                measurements.maxReverseVoltageExceeded = Math.max(0, -voltage) > component.maxReverseVoltage;
            } else if (component instanceof LED) {
                measurements.maxForwardCurrentExceeded = current > component.maxForwardCurrent;
            } else if (component instanceof Capacitor) {
                measurements.ratedVoltageExceeded = Math.abs(voltage) > component.ratedVoltage;
            } else if (component instanceof Inductor && component.maxCurrentAmps !== undefined) {
                measurements.maxCurrentExceeded = Math.abs(current) > component.maxCurrentAmps;
            } else if (component instanceof DCMotor) {
                measurements.rpm = component.noLoadRPM * Math.max(0, Math.min(1, Math.abs(voltage) / component.nominalVoltage));
                measurements.stalled = component.stallCurrent !== undefined && Math.abs(current) >= component.stallCurrent;
            } else if (component instanceof ActiveBuzzer) {
                measurements.active = Math.abs(voltage) >= component.nominalVoltage;
            } else if (component instanceof UltrasonicSensor) {
                measurements.distanceCm = component.distanceCm;
                measurements.echoPulseWidthMicroseconds = activeSensors.has(component.id) ? component.distanceCm * 58 : 0;
                measurements.triggered = activeSensors.has(component.id);
            } else if (component instanceof Transistor) {
                measurements.conducting = activeTransistors.has(component.id);
                measurements.maxCollectorCurrentExceeded = Math.abs(current) > component.maxCollectorCurrent;
                measurements.maxCollectorEmitterVoltageExceeded = Math.abs(voltage) > component.maxCollectorEmitterVoltage;
            }
            if (component instanceof Capacitor) current = 0;
            return {
                componentId: component.id,
                type: component.type,
                voltage,
                current,
                power: voltage * current,
                ...(Object.keys(measurements).length ? { measurements } : {}),
            };
        });

        return {
            success: true,
            nodes: originalNodes.map(node => ({ nodeId: node.id, voltage: solution!.voltage(nodeOf(node.id)) })),
            components: componentResults,
            errors: [],
        };
    }
}

function sameSet(a: Set<string>, b: Set<string>): boolean {
    return a.size === b.size && [...a].every(value => b.has(value));
}
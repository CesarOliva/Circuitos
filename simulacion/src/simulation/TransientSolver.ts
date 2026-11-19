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
import type { ComponentResult, NodeResult } from "./SimulationResult.ts";

const MIN_CONDUCTANCE = 1e-12;
const ON_RESISTANCE = 1e-3;

export interface TransientControlWaveforms {
    switchClosed?: Readonly<Record<string, (timeSeconds: number) => boolean>>;
    pushButtonPressed?: Readonly<Record<string, (timeSeconds: number) => boolean>>;
    potentiometerPositions?: Readonly<Record<string, (timeSeconds: number) => number>>;
    ldrIlluminanceLux?: Readonly<Record<string, (timeSeconds: number) => number>>;
    ultrasonicDistancesCm?: Readonly<Record<string, (timeSeconds: number) => number>>;
}

export interface TransientOptions {
    durationSeconds: number;
    timeStepSeconds: number;
    initialConditions?: {
        capacitorVoltages?: Readonly<Record<string, number>>;
        inductorCurrents?: Readonly<Record<string, number>>;
    };
    sourceWaveforms?: Readonly<Record<string, (timeSeconds: number) => number>>;
    controlWaveforms?: TransientControlWaveforms;
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

type NonlinearBranch = {
    componentId: string;
    positive: string;
    negative: string;
    threshold: number;
    kind: "diode" | "transistor";
};

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
        const sources = components.filter((item): item is DCVoltageSource => item instanceof DCVoltageSource);
        const capacitors = components.filter((item): item is Capacitor => item instanceof Capacitor);
        const inductors = components.filter((item): item is Inductor => item instanceof Inductor);
        const transistors = components.filter((item): item is Transistor => item instanceof Transistor);
        const sensors = components.filter((item): item is UltrasonicSensor => item instanceof UltrasonicSensor);
        if (components.length === 0) throw new Error("Circuit is empty");
        if (sources.length === 0) throw new Error("At least one DC source is required");

        const supported = (item: (typeof components)[number]) =>
            item instanceof DCVoltageSource || item instanceof Resistor || item instanceof Capacitor ||
            item instanceof Inductor || item instanceof LDR || item instanceof UltrasonicSensor ||
            item instanceof Potentiometer || item instanceof PushButton || item instanceof Switch ||
            item instanceof Diode || item instanceof LED || item instanceof Transistor ||
            item instanceof DCMotor || item instanceof ActiveBuzzer;
        for (const component of components) {
            if (!supported(component)) throw new Error(`Unsupported component in transient analysis: ${component.id} (${component.type})`);
        }

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
        const nodes = originalNodes.map(node => node.id);
        const groundId = getNode(sources[0]!.id, "-");

        const sourceWaveforms = new Map(Object.entries(options.sourceWaveforms ?? {}));
        validateWaveforms(sourceWaveforms, new Set(sources.map(item => item.id)), "voltage source");
        const controlWaveforms = options.controlWaveforms ?? {};
        const switchWaveforms = new Map(Object.entries(controlWaveforms.switchClosed ?? {}));
        const pushButtonWaveforms = new Map(Object.entries(controlWaveforms.pushButtonPressed ?? {}));
        const potentiometerWaveforms = new Map(Object.entries(controlWaveforms.potentiometerPositions ?? {}));
        const ldrWaveforms = new Map(Object.entries(controlWaveforms.ldrIlluminanceLux ?? {}));
        const sensorDistanceWaveforms = new Map(Object.entries(controlWaveforms.ultrasonicDistancesCm ?? {}));
        validateWaveforms(switchWaveforms, new Set(components.filter((item): item is Switch => item instanceof Switch).map(item => item.id)), "switch");
        validateWaveforms(pushButtonWaveforms, new Set(components.filter((item): item is PushButton => item instanceof PushButton).map(item => item.id)), "push button");
        validateWaveforms(potentiometerWaveforms, new Set(components.filter((item): item is Potentiometer => item instanceof Potentiometer).map(item => item.id)), "potentiometer");
        validateWaveforms(ldrWaveforms, new Set(components.filter((item): item is LDR => item instanceof LDR).map(item => item.id)), "LDR");
        validateWaveforms(sensorDistanceWaveforms, new Set(sensors.map(item => item.id)), "ultrasonic sensor");

        const capacitorById = new Map(capacitors.map(item => [item.id, item]));
        const inductorById = new Map(inductors.map(item => [item.id, item]));
        const capacitorVoltage = initialValues(
            options.initialConditions?.capacitorVoltages,
            capacitorById,
            "capacitor voltage",
        );
        const inductorCurrent = initialValues(
            options.initialConditions?.inductorCurrents,
            inductorById,
            "inductor current",
        );

        const nonlinear: NonlinearBranch[] = [];
        for (const component of components) {
            if (component instanceof Diode) {
                nonlinear.push({ componentId: component.id, positive: getNode(component.id, "A"), negative: getNode(component.id, "K"), threshold: component.nominalForwardVoltage, kind: "diode" });
            } else if (component instanceof LED) {
                nonlinear.push({ componentId: component.id, positive: getNode(component.id, "A"), negative: getNode(component.id, "K"), threshold: component.forwardVoltage, kind: "diode" });
            } else if (component instanceof Transistor) {
                const base = getNode(component.id, "B");
                const emitter = getNode(component.id, "E");
                const forward = component.polarity === "NPN";
                nonlinear.push({
                    componentId: `${component.id}:BE`,
                    positive: forward ? base : emitter,
                    negative: forward ? emitter : base,
                    threshold: component.nominalBaseEmitterVoltage,
                    kind: "transistor",
                });
            }
        }

        const samples: TransientSample[] = [];
        const pulseEnd = new Map(sensors.map(sensor => [sensor.id, -Infinity]));
        const previousTrigger = new Map(sensors.map(sensor => [sensor.id, false]));
        const sensorHighVoltage = new Map(sensors.map(sensor => [sensor.id, 0]));
        let activeDiodes = new Set<string>();
        let activeTransistors = new Set<string>();
        let transistorConductances = new Map<string, number>();
        let time = 0;

        for (let step = 0; step < stepCount; step++) {
            const dt = Math.min(timeStepSeconds, durationSeconds - time);
            const sampleTime = Math.min(durationSeconds, time + dt);
            const potValues = new Map<string, { position: number; resistanceAW: number; resistanceWB: number }>();
            const ldrResistance = new Map<string, number>();
            const sensorDistances = new Map<string, number>();
            const switchClosed = new Map<string, boolean>();
            const pushButtonPressed = new Map<string, boolean>();

            for (const item of components) {
                if (item instanceof Potentiometer) {
                    const position = numberAt(potentiometerWaveforms, item.id, sampleTime, item.position, 0, 1, "potentiometer position");
                    potValues.set(item.id, {
                        position,
                        resistanceAW: item.totalResistanceOhms * position,
                        resistanceWB: item.totalResistanceOhms * (1 - position),
                    });
                } else if (item instanceof LDR) {
                    const lux = numberAt(ldrWaveforms, item.id, sampleTime, item.illuminanceLux, 0, Infinity, "LDR illuminance");
                    ldrResistance.set(item.id, item.referenceResistanceOhms * Math.pow(item.referenceLux / Math.max(lux, item.minLux), item.gamma));
                } else if (item instanceof UltrasonicSensor) {
                    sensorDistances.set(item.id, numberAt(sensorDistanceWaveforms, item.id, sampleTime, item.distanceCm, 0, Infinity, "ultrasonic distance"));
                } else if (item instanceof Switch) {
                    switchClosed.set(item.id, booleanAt(switchWaveforms, item.id, sampleTime, item.closed, "switch state"));
                } else if (item instanceof PushButton) {
                    pushButtonPressed.set(item.id, booleanAt(pushButtonWaveforms, item.id, sampleTime, item.pressed, "push-button state"));
                }
            }

            const idealConstraints: VoltageConstraint[] = [];
            const idealConstraintByComponent = new Map<string, string>();
            const parent = new Map(nodes.map(node => [node, node]));
            const find = (node: string): string => {
                const root = parent.get(node);
                if (root === undefined) throw new Error(`Unknown node ${node}`);
                if (root === node) return node;
                const representative = find(root);
                parent.set(node, representative);
                return representative;
            };
            const addIdealLink = (componentId: string, terminalA: string, terminalB: string) => {
                const positive = getNode(componentId, terminalA);
                const negative = getNode(componentId, terminalB);
                const rootA = find(positive);
                const rootB = find(negative);
                if (rootA === rootB) return;
                const id = JSON.stringify([componentId, "ideal-link", terminalA, terminalB]);
                idealConstraints.push({ id, positive, negative, voltage: 0 });
                idealConstraintByComponent.set(componentId, id);
                parent.set(rootB, rootA);
            };
            for (const item of components) {
                if (item instanceof Switch && switchClosed.get(item.id)) addIdealLink(item.id, "1", "2");
                else if (item instanceof PushButton) {
                    const pressed = pushButtonPressed.get(item.id)!;
                    const closed = item.contact === "NO" ? pressed : !pressed;
                    if (closed) addIdealLink(item.id, "1", "2");
                } else if (item instanceof Potentiometer) {
                    const values = potValues.get(item.id)!;
                    if (values.resistanceAW === 0) addIdealLink(item.id, "A", "W");
                    if (values.resistanceWB === 0) addIdealLink(item.id, "W", "B");
                }
            }

            activeDiodes = new Set([...activeDiodes].filter(id => nonlinear.some(item => item.kind === "diode" && item.componentId === id)));
            activeTransistors = new Set([...activeTransistors].filter(id => components.some(item => item instanceof Transistor && item.id === id)));
            const activeSensors = new Set(sensors.filter(sensor => sampleTime < pulseEnd.get(sensor.id)!).map(sensor => sensor.id));
            let solution: ReturnType<typeof solveNetwork> | undefined;
            let finalBranches: ConductanceBranch[] = [];
            let settled = false;

            for (let iteration = 0; iteration < 30; iteration++) {
                const branches: ConductanceBranch[] = [];
                const componentBranches = new Map<string, ConductanceBranch[]>();
                const addBranch = (componentId: string, positive: string, negative: string, resistance: number) => {
                    if (!Number.isFinite(resistance) || resistance <= 0) throw new Error(`Invalid resistance in ${componentId}`);
                    const branch: ConductanceBranch = { id: componentId, positive: getNode(componentId, positive), negative: getNode(componentId, negative), conductance: 1 / resistance };
                    branches.push(branch);
                    const list = componentBranches.get(componentId) ?? [];
                    list.push(branch);
                    componentBranches.set(componentId, list);
                };

                for (const item of components) {
                    if (item instanceof Resistor) addBranch(item.id, "1", "2", item.getResistance());
                    else if (item instanceof LDR) addBranch(item.id, "1", "2", ldrResistance.get(item.id)!);
                    else if (item instanceof Potentiometer) {
                        const values = potValues.get(item.id)!;
                        if (values.resistanceAW > 0) addBranch(item.id, "A", "W", values.resistanceAW);
                        if (values.resistanceWB > 0) addBranch(item.id, "W", "B", values.resistanceWB);
                    } else if (item instanceof Capacitor) {
                        const terminals = capTerminals(item);
                        const conductance = 1 / (item.equivalentSeriesResistanceOhms + dt / item.capacitanceFarads);
                        branches.push({ id: item.id, positive: getNode(item.id, terminals[0]), negative: getNode(item.id, terminals[1]), conductance, currentOffset: -conductance * capacitorVoltage.get(item.id)! });
                    } else if (item instanceof Inductor) {
                        const inductiveResistance = item.inductanceHenries / dt;
                        const conductance = 1 / (item.seriesResistanceOhms + inductiveResistance);
                        branches.push({ id: item.id, positive: getNode(item.id, "1"), negative: getNode(item.id, "2"), conductance, currentOffset: inductiveResistance * inductorCurrent.get(item.id)! * conductance });
                    } else if (item instanceof DCMotor) {
                        addBranch(item.id, "+", "-", item.nominalVoltage / Math.max(item.noLoadCurrent, 1e-6));
                    } else if (item instanceof ActiveBuzzer) {
                        addBranch(item.id, "+", "-", item.nominalVoltage / item.nominalCurrent);
                    }
                }

                for (const item of nonlinear) {
                    const transistorId = item.kind === "transistor" ? item.componentId.slice(0, -3) : undefined;
                    const conducting = transistorId ? activeTransistors.has(transistorId) : activeDiodes.has(item.componentId);
                    const conductance = conducting ? 1 / ON_RESISTANCE : MIN_CONDUCTANCE;
                    branches.push({
                        id: item.componentId,
                        positive: item.positive,
                        negative: item.negative,
                        conductance,
                        currentOffset: conducting ? -conductance * item.threshold : 0,
                    });
                }

                for (const transistor of transistors) {
                    if (!activeTransistors.has(transistor.id)) continue;
                    const collector = getNode(transistor.id, "C");
                    const emitter = getNode(transistor.id, "E");
                    const forward = transistor.polarity === "NPN";
                    branches.push({
                        id: `${transistor.id}:CE`,
                        positive: forward ? collector : emitter,
                        negative: forward ? emitter : collector,
                        conductance: transistorConductances.get(transistor.id) ?? MIN_CONDUCTANCE,
                    });
                }

                const constraints: VoltageConstraint[] = [...idealConstraints];
                for (const source of sources) {
                    const waveform = sourceWaveforms.get(source.id);
                    const voltage = waveform ? waveform(sampleTime) : source.getVoltage();
                    if (!Number.isFinite(voltage)) throw new Error(`Voltage waveform for source ${source.id} returned a non-finite value at ${sampleTime} seconds`);
                    constraints.push({ id: source.id, positive: getNode(source.id, "+"), negative: getNode(source.id, "-"), voltage });
                }
                for (const sensor of sensors) {
                    constraints.push({
                        id: JSON.stringify([sensor.id, "echo"]),
                        positive: getNode(sensor.id, "ECHO"),
                        negative: getNode(sensor.id, "GND"),
                        voltage: activeSensors.has(sensor.id) ? sensorHighVoltage.get(sensor.id)! : 0,
                    });
                }

                solution = solveNetwork(nodes, groundId, branches, constraints);
                finalBranches = branches;
                const nextDiodes = new Set(nonlinear.filter(item => item.kind === "diode" && solution!.voltage(item.positive) - solution!.voltage(item.negative) >= item.threshold).map(item => item.componentId));
                const nextTransistors = new Set(transistors.filter(transistor => {
                    const base = getNode(transistor.id, "B");
                    const emitter = getNode(transistor.id, "E");
                    const vbe = transistor.polarity === "NPN" ? solution!.voltage(base) - solution!.voltage(emitter) : solution!.voltage(emitter) - solution!.voltage(base);
                    return vbe >= transistor.nominalBaseEmitterVoltage;
                }).map(item => item.id));
                const nextConductances = new Map<string, number>();
                for (const transistor of transistors) {
                    if (!nextTransistors.has(transistor.id)) continue;
                    const base = getNode(transistor.id, "B");
                    const emitter = getNode(transistor.id, "E");
                    const vbe = transistor.polarity === "NPN" ? solution.voltage(base) - solution.voltage(emitter) : solution.voltage(emitter) - solution.voltage(base);
                    const baseCurrent = Math.max(0, (vbe - transistor.nominalBaseEmitterVoltage) / ON_RESISTANCE);
                    const collectorCurrent = Math.min(transistor.maxCollectorCurrent, transistor.dcGainBeta * baseCurrent);
                    nextConductances.set(transistor.id, collectorCurrent / transistor.maxCollectorEmitterVoltage);
                }

                let sensorStateChanged = false;
                let sensorVoltagesStable = true;
                for (const sensor of sensors) {
                    const voltage = solution.voltage(getNode(sensor.id, "VCC")) - solution.voltage(getNode(sensor.id, "GND"));
                    const previousVoltage = sensorHighVoltage.get(sensor.id)!;
                    sensorHighVoltage.set(sensor.id, voltage);
                    sensorVoltagesStable &&= Math.abs(voltage - previousVoltage) <= 1e-9 * Math.max(1, Math.abs(voltage), Math.abs(previousVoltage));
                    const triggerHigh = solution.voltage(getNode(sensor.id, "TRIG")) >= 2.5;
                    const risingEdge = triggerHigh && !previousTrigger.get(sensor.id)!;
                    previousTrigger.set(sensor.id, triggerHigh);
                    const distance = sensorDistances.get(sensor.id)!;
                    if (risingEdge && distance >= sensor.minDistanceCm && distance <= sensor.maxDistanceCm) {
                        pulseEnd.set(sensor.id, sampleTime + distance * 58e-6);
                    }
                    const echoActive = sampleTime < pulseEnd.get(sensor.id)!;
                    if (echoActive !== activeSensors.has(sensor.id)) sensorStateChanged = true;
                    if (echoActive) activeSensors.add(sensor.id);
                    else activeSensors.delete(sensor.id);
                }

                const diodeStable = sameSet(activeDiodes, nextDiodes);
                const transistorStable = sameSet(activeTransistors, nextTransistors) && sameMap(transistorConductances, nextConductances);
                const stable = diodeStable && transistorStable && !sensorStateChanged && sensorVoltagesStable;
                activeDiodes = nextDiodes;
                activeTransistors = nextTransistors;
                transistorConductances = nextConductances;
                if (stable) {
                    settled = true;
                    break;
                }
            }
            if (!solution || !settled) throw new Error("Transient circuit did not converge");

            const voltageOf = (componentId: string, terminalId: string) => solution!.voltage(getNode(componentId, terminalId));
            const nodeResults = originalNodes.map(node => ({ nodeId: node.id, voltage: solution!.voltage(node.id) }));
            const componentResults: ComponentResult[] = components.map(component => {
                let positive: string;
                let negative: string;
                if (component instanceof DCVoltageSource || component instanceof DCMotor || component instanceof ActiveBuzzer) {
                    positive = "+"; negative = "-";
                } else if (component instanceof Diode || component instanceof LED) {
                    positive = "A"; negative = "K";
                } else if (component instanceof Transistor) {
                    positive = component.polarity === "NPN" ? "C" : "E";
                    negative = component.polarity === "NPN" ? "E" : "C";
                } else if (component instanceof UltrasonicSensor) {
                    positive = "ECHO"; negative = "GND";
                } else if (component instanceof Potentiometer) {
                    positive = "A"; negative = "B";
                } else {
                    positive = component.terminals[0]!.id; negative = component.terminals[1]!.id;
                }
                const voltage = voltageOf(component.id, positive) - voltageOf(component.id, negative);
                const componentBranchList = finalBranches.filter(branch => branch.id === component.id);
                let current = componentBranchList.length ? solution!.branchCurrent(componentBranchList[0]!) : 0;
                if (component instanceof DCVoltageSource) current = solution!.voltageSourceCurrent(component.id);
                else if (component instanceof Switch || component instanceof PushButton ||
                    (component instanceof Potentiometer && potValues.get(component.id)!.resistanceAW === 0)) {
                    const id = idealConstraintByComponent.get(component.id);
                    current = id ? solution!.voltageSourceCurrent(id) : 0;
                } else if (component instanceof Diode || component instanceof LED) {
                    const model = nonlinear.find(item => item.componentId === component.id)!;
                    current = activeDiodes.has(component.id) ? (voltage - model.threshold) / ON_RESISTANCE : 0;
                } else if (component instanceof Transistor) {
                    const branch = finalBranches.find(item => item.id === `${component.id}:CE`);
                    current = branch ? solution!.branchCurrent(branch) : 0;
                } else if (component instanceof UltrasonicSensor) {
                    current = solution!.voltageSourceCurrent(JSON.stringify([component.id, "echo"]));
                }

                const measurements: Record<string, number | boolean> = {};
                if (component instanceof Resistor) measurements.ratedPowerExceeded = Math.abs(voltage * current) > component.ratedPower;
                else if (component instanceof DCVoltageSource) measurements.maxCurrentExceeded = Math.abs(current) > component.maxCurrent;
                else if (component instanceof Capacitor) measurements.ratedVoltageExceeded = Math.abs(voltage) > component.ratedVoltage;
                else if (component instanceof Inductor && component.maxCurrentAmps !== undefined) measurements.maxCurrentExceeded = Math.abs(current) > component.maxCurrentAmps;
                else if (component instanceof Diode) {
                    measurements.maxForwardCurrentExceeded = current > component.maxForwardCurrent;
                    measurements.maxReverseVoltageExceeded = Math.max(0, -voltage) > component.maxReverseVoltage;
                } else if (component instanceof LED) measurements.maxForwardCurrentExceeded = current > component.maxForwardCurrent;
                else if (component instanceof Transistor) {
                    measurements.conducting = activeTransistors.has(component.id);
                    measurements.maxCollectorCurrentExceeded = Math.abs(current) > component.maxCollectorCurrent;
                    measurements.maxCollectorEmitterVoltageExceeded = Math.abs(voltage) > component.maxCollectorEmitterVoltage;
                } else if (component instanceof DCMotor) {
                    measurements.rpm = component.noLoadRPM * Math.max(0, Math.min(1, Math.abs(voltage) / component.nominalVoltage));
                    measurements.stalled = component.stallCurrent !== undefined && Math.abs(current) >= component.stallCurrent;
                } else if (component instanceof ActiveBuzzer) measurements.active = Math.abs(voltage) >= component.nominalVoltage;
                else if (component instanceof UltrasonicSensor) {
                    const distance = sensorDistances.get(component.id)!;
                    measurements.distanceCm = distance;
                    measurements.triggered = activeSensors.has(component.id);
                    measurements.echoPulseWidthMicroseconds = activeSensors.has(component.id) ? distance * 58 : 0;
                }
                return {
                    componentId: component.id,
                    type: component.type,
                    voltage,
                    current,
                    power: voltage * current,
                    ...(Object.keys(measurements).length ? { measurements } : {}),
                };
            });

            for (const component of capacitors) {
                const voltage = voltageOf(component.id, capTerminals(component)[0]) - voltageOf(component.id, capTerminals(component)[1]);
                const branch = finalBranches.find(item => item.id === component.id)!;
                capacitorVoltage.set(component.id, voltage - component.equivalentSeriesResistanceOhms * solution.branchCurrent(branch));
            }
            for (const component of inductors) {
                const branch = finalBranches.find(item => item.id === component.id)!;
                inductorCurrent.set(component.id, solution.branchCurrent(branch));
            }

            time = sampleTime;
            samples.push({ timeSeconds: time, nodes: nodeResults, components: componentResults });
        }
        return samples;
    }
}

function capTerminals(capacitor: Capacitor): [string, string] {
    return capacitor.polarized ? ["+", "-"] : ["1", "2"];
}

function initialValues<T extends { id: string }>(
    values: Readonly<Record<string, number>> | undefined,
    validItems: ReadonlyMap<string, T>,
    label: string,
): Map<string, number> {
    const result = new Map([...validItems.keys()].map(id => [id, 0]));
    for (const [id, value] of Object.entries(values ?? {})) {
        const componentLabel = label === "capacitor voltage" ? "capacitor" : "inductor";
        if (!validItems.has(id)) throw new Error(`Initial ${label} references unknown ${componentLabel} ${id}`);
        if (!Number.isFinite(value)) throw new Error(`Initial ${label} for ${id} must be finite`);
        result.set(id, value);
    }
    return result;
}

function validateWaveforms<T>(waveforms: ReadonlyMap<string, T>, validIds: ReadonlySet<string>, label: string): void {
    for (const [id, waveform] of waveforms) {
        const componentLabel = label === "voltage source" ? "source" : "component";
        if (!validIds.has(id)) throw new Error(`${label} waveform references unknown ${componentLabel} ${id}`);
        if (typeof waveform !== "function") throw new Error(`${label} waveform for ${id} must be a function`);
    }
}

function numberAt(
    waveforms: ReadonlyMap<string, (timeSeconds: number) => number>,
    id: string,
    timeSeconds: number,
    fallback: number,
    minimum: number,
    maximum: number,
    label: string,
): number {
    const waveform = waveforms.get(id);
    const value = waveform ? waveform(timeSeconds) : fallback;
    if (!Number.isFinite(value) || value < minimum || value > maximum) {
        throw new Error(`${label} for ${id} must be finite and between ${minimum} and ${maximum}`);
    }
    return value;
}

function booleanAt(
    waveforms: ReadonlyMap<string, (timeSeconds: number) => boolean>,
    id: string,
    timeSeconds: number,
    fallback: boolean,
    label: string,
): boolean {
    const waveform = waveforms.get(id);
    const value = waveform ? waveform(timeSeconds) : fallback;
    if (typeof value !== "boolean") throw new Error(`${label} for ${id} must return a boolean`);
    return value;
}

function sameSet(a: Set<string>, b: Set<string>): boolean {
    return a.size === b.size && [...a].every(value => b.has(value));
}

function sameMap(a: Map<string, number>, b: Map<string, number>): boolean {
    return a.size === b.size && [...a].every(([key, value]) => {
        const other = b.get(key);
        return other !== undefined && Math.abs(value - other) <= 1e-6 * Math.max(Math.abs(value), Math.abs(other), MIN_CONDUCTANCE);
    });
}

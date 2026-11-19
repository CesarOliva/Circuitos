import { describe, expect, it } from "vitest";
import {
  ActiveBuzzer,
  Capacitor,
  Circuit,
  Connection,
  DCSolver,
  DCVoltageSource,
  DCMotor,
  Diode,
  Inductor,
  LED,
  LDR,
  LinearSystemSolver,
  Potentiometer,
  PushButton,
  Resistor,
  Switch,
  TransientSolver,
  Transistor,
  UltrasonicSensor,
} from "../src/index.ts";

function connect(circuit, id, fromComponent, fromTerminal, toComponent, toTerminal) {
  circuit.addConnection(new Connection(id,
    { componentId: fromComponent, terminalId: fromTerminal },
    { componentId: toComponent, terminalId: toTerminal },
  ));
}

function circuitWithLoad(sourceVoltage, load, loadTerminals = ["1", "2"]) {
  const circuit = new Circuit("test", "single load");
  circuit.addComponent(new DCVoltageSource("V1", sourceVoltage));
  circuit.addComponent(load);
  connect(circuit, "W1", "V1", "+", load.id, loadTerminals[0]);
  connect(circuit, "W2", load.id, loadTerminals[1], "V1", "-");
  return circuit;
}

function componentResult(result, id) {
  const value = result.components.find(item => item.componentId === id);
  expect(value, `missing result for ${id}`).toBeDefined();
  return value;
}

function nodeVoltage(circuit, result, componentId, terminalId) {
  const node = circuit.getNodeOfTerminal(componentId, terminalId);
  return result.nodes.find(item => item.nodeId === node.id)?.voltage;
}

function expectPowerBalance(result, precision = 10) {
  const totalPower = result.components.reduce((sum, item) => sum + item.power, 0);
  expect(totalPower).toBeCloseTo(0, precision);
}

describe("LinearSystemSolver", () => {
  it("solves a system that requires row pivoting", () => {
    expect(LinearSystemSolver.solve([[0, 2], [1, 1]], [4, 3])).toEqual([1, 2]);
  });

  it("handles small but well-scaled coefficients", () => {
    expect(LinearSystemSolver.solve([[1e-14]], [2e-14])).toEqual([2]);
  });

  it("rejects invalid dimensions, non-finite values, and singular matrices", () => {
    expect(() => LinearSystemSolver.solve([[1, 2]], [1])).toThrow(/dimensions/i);
    expect(() => LinearSystemSolver.solve([[Infinity]], [1])).toThrow(/finite/i);
    expect(() => LinearSystemSolver.solve([[1, 2], [2, 4]], [1, 2])).toThrow(/singular/i);
  });
});

describe("DCSolver reference circuits", () => {
  it("solves a voltage divider and satisfies KCL and power balance", () => {
    const circuit = new Circuit("test", "divider");
    circuit.addComponent(new DCVoltageSource("V1", 12));
    circuit.addComponent(new Resistor("R1", 1000));
    circuit.addComponent(new Resistor("R2", 2000));
    connect(circuit, "W1", "V1", "+", "R1", "1");
    connect(circuit, "W2", "R1", "2", "R2", "1");
    connect(circuit, "W3", "R2", "2", "V1", "-");

    const result = new DCSolver().simulate(circuit);
    expect(result.success).toBe(true);
    expect(nodeVoltage(circuit, result, "R1", "2")).toBeCloseTo(8);
    expect(componentResult(result, "R1").current).toBeCloseTo(0.004);
    expect(componentResult(result, "R2").current).toBeCloseTo(0.004);
    expect(componentResult(result, "V1").current).toBeCloseTo(-0.004);

    const middleNodeResidual = -componentResult(result, "R1").current + componentResult(result, "R2").current;
    expect(middleNodeResidual).toBeCloseTo(0, 12);
    expectPowerBalance(result);
  });

  it("handles independent sources in series", () => {
    const circuit = new Circuit("test", "series sources");
    circuit.addComponent(new DCVoltageSource("V1", 5));
    circuit.addComponent(new DCVoltageSource("V2", 3));
    circuit.addComponent(new Resistor("R1", 1000));
    connect(circuit, "W1", "V1", "+", "V2", "-");
    connect(circuit, "W2", "V2", "+", "R1", "1");
    connect(circuit, "W3", "R1", "2", "V1", "-");

    const result = new DCSolver().simulate(circuit);
    expect(result.success).toBe(true);
    expect(componentResult(result, "R1").voltage).toBeCloseTo(8);
    expect(componentResult(result, "R1").current).toBeCloseTo(0.008);
    expectPowerBalance(result);
  });
});

describe("DC component models", () => {
  it("models resistors and flags rated-power violations", () => {
    const circuit = circuitWithLoad(10, new Resistor("R1", 100, 5, 0.1));
    const result = new DCSolver().simulate(circuit);
    expect(result.success).toBe(true);
    expect(componentResult(result, "R1").current).toBeCloseTo(0.1);
    expect(componentResult(result, "R1").measurements.ratedPowerExceeded).toBe(true);
    expectPowerBalance(result);
  });

  it("models a closed switch as an ideal connection and reports its current", () => {
    const circuit = new Circuit("test", "closed switch");
    circuit.addComponent(new DCVoltageSource("V1", 5));
    circuit.addComponent(new Switch("S1", true));
    circuit.addComponent(new Resistor("R1", 1000));
    connect(circuit, "W1", "V1", "+", "S1", "1");
    connect(circuit, "W2", "S1", "2", "R1", "1");
    connect(circuit, "W3", "R1", "2", "V1", "-");
    const result = new DCSolver().simulate(circuit);
    expect(result.success).toBe(true);
    expect(componentResult(result, "S1").current).toBeCloseTo(0.005);
    expect(componentResult(result, "R1").current).toBeCloseTo(0.005);

    const open = new Circuit("test", "open switch");
    open.addComponent(new DCVoltageSource("V1", 5));
    open.addComponent(new Switch("S1", false));
    open.addComponent(new Resistor("R1", 1000));
    connect(open, "W1", "V1", "+", "S1", "1");
    connect(open, "W2", "S1", "2", "R1", "1");
    connect(open, "W3", "R1", "2", "V1", "-");
    const openResult = new DCSolver().simulate(open);
    expect(openResult.success).toBe(true);
    expect(componentResult(openResult, "R1").current).toBeCloseTo(0);
  });

  it("models a pressed normally-open push button as closed", () => {
    const button = new PushButton("PB1");
    button.press();
    const circuit = new Circuit("test", "pressed button");
    circuit.addComponent(new DCVoltageSource("V1", 5));
    circuit.addComponent(button);
    circuit.addComponent(new Resistor("R1", 1000));
    connect(circuit, "W1", "V1", "+", "PB1", "1");
    connect(circuit, "W2", "PB1", "2", "R1", "1");
    connect(circuit, "W3", "R1", "2", "V1", "-");
    expect(componentResult(new DCSolver().simulate(circuit), "R1").current).toBeCloseTo(0.005);
  });

  it("models the potentiometer wiper ratio and endpoint shorts", () => {
    const circuit = new Circuit("test", "potentiometer");
    circuit.addComponent(new DCVoltageSource("V1", 10));
    circuit.addComponent(new Potentiometer("P1", 10000, 0.25));
    connect(circuit, "W1", "V1", "+", "P1", "A");
    connect(circuit, "W2", "P1", "B", "V1", "-");
    const result = new DCSolver().simulate(circuit);
    expect(result.success).toBe(true);
    expect(nodeVoltage(circuit, result, "P1", "W")).toBeCloseTo(7.5);

    const endpoint = new Circuit("test", "potentiometer endpoint");
    endpoint.addComponent(new DCVoltageSource("V1", 10));
    endpoint.addComponent(new Potentiometer("P1", 10000, 0));
    connect(endpoint, "W1", "V1", "+", "P1", "A");
    connect(endpoint, "W2", "P1", "B", "V1", "-");
    const endpointResult = new DCSolver().simulate(endpoint);
    expect(endpointResult.success).toBe(true);
    expect(nodeVoltage(endpoint, endpointResult, "P1", "W")).toBeCloseTo(10);
  });

  it("uses the configured LDR resistance", () => {
    const circuit = circuitWithLoad(10, new LDR("LDR1", 10000, 10, 1, 20));
    const result = new DCSolver().simulate(circuit);
    expect(result.success).toBe(true);
    expect(componentResult(result, "LDR1").current).toBeCloseTo(0.002);
  });

  it("models capacitors as open and inductors by series resistance in DC", () => {
    const capacitorCircuit = circuitWithLoad(5, new Capacitor("C1", 1e-6, 10));
    const capacitorResult = new DCSolver().simulate(capacitorCircuit);
    expect(capacitorResult.success).toBe(true);
    expect(componentResult(capacitorResult, "C1").voltage).toBeCloseTo(5);
    expect(componentResult(capacitorResult, "C1").current).toBe(0);

    const inductorCircuit = new Circuit("test", "inductor");
    inductorCircuit.addComponent(new DCVoltageSource("V1", 5));
    inductorCircuit.addComponent(new Resistor("R1", 1000));
    inductorCircuit.addComponent(new Inductor("L1", 1, 10));
    connect(inductorCircuit, "W1", "V1", "+", "R1", "1");
    connect(inductorCircuit, "W2", "R1", "2", "L1", "1");
    connect(inductorCircuit, "W3", "L1", "2", "V1", "-");
    const inductorResult = new DCSolver().simulate(inductorCircuit);
    expect(inductorResult.success).toBe(true);
    expect(componentResult(inductorResult, "L1").current).toBeCloseTo(5 / 1010);
  });

  it("models forward diodes and LED current limits", () => {
    const diodeCircuit = new Circuit("test", "diode");
    diodeCircuit.addComponent(new DCVoltageSource("V1", 5));
    diodeCircuit.addComponent(new Resistor("R1", 1000));
    diodeCircuit.addComponent(new Diode("D1"));
    connect(diodeCircuit, "W1", "V1", "+", "R1", "1");
    connect(diodeCircuit, "W2", "R1", "2", "D1", "A");
    connect(diodeCircuit, "W3", "D1", "K", "V1", "-");
    const diodeResult = new DCSolver().simulate(diodeCircuit);
    expect(diodeResult.success).toBe(true);
    expect(componentResult(diodeResult, "D1").voltage).toBeCloseTo(0.7, 2);
    expect(componentResult(diodeResult, "D1").current).toBeCloseTo(0.004295, 4);
    expectPowerBalance(diodeResult, 6);

    const reverseCircuit = new Circuit("test", "reverse diode");
    reverseCircuit.addComponent(new DCVoltageSource("V1", 5));
    reverseCircuit.addComponent(new Resistor("R1", 1000));
    reverseCircuit.addComponent(new Diode("D1"));
    connect(reverseCircuit, "W1", "V1", "+", "R1", "1");
    connect(reverseCircuit, "W2", "R1", "2", "D1", "K");
    connect(reverseCircuit, "W3", "D1", "A", "V1", "-");
    const reverseResult = new DCSolver().simulate(reverseCircuit);
    expect(reverseResult.success).toBe(true);
    expect(componentResult(reverseResult, "D1").current).toBe(0);
    expect(componentResult(reverseResult, "D1").voltage).toBeCloseTo(-5);

    const ledCircuit = new Circuit("test", "LED");
    ledCircuit.addComponent(new DCVoltageSource("V1", 5));
    ledCircuit.addComponent(new Resistor("R1", 1000));
    ledCircuit.addComponent(new LED("LED1", "red", 2, 0.002));
    connect(ledCircuit, "W1", "V1", "+", "R1", "1");
    connect(ledCircuit, "W2", "R1", "2", "LED1", "A");
    connect(ledCircuit, "W3", "LED1", "K", "V1", "-");
    const ledResult = new DCSolver().simulate(ledCircuit);
    expect(ledResult.success).toBe(true);
    expect(componentResult(ledResult, "LED1").measurements.maxForwardCurrentExceeded).toBe(true);
  });

  it("models BJT base drive and transistor limits", () => {
    const circuit = new Circuit("test", "BJT");
    circuit.addComponent(new DCVoltageSource("V1", 5));
    circuit.addComponent(new Resistor("RB", 1000));
    circuit.addComponent(new Resistor("RC", 100));
    circuit.addComponent(new Transistor("Q1", "NPN", 100, 0.1, 50));
    connect(circuit, "W1", "V1", "+", "RB", "1");
    connect(circuit, "W2", "RB", "2", "Q1", "B");
    connect(circuit, "W3", "V1", "+", "RC", "1");
    connect(circuit, "W4", "RC", "2", "Q1", "C");
    connect(circuit, "W5", "Q1", "E", "V1", "-");
    const result = new DCSolver().simulate(circuit);
    expect(result.success).toBe(true);
    expect(componentResult(result, "Q1").measurements.conducting).toBe(true);
    expect(componentResult(result, "Q1").current).toBeGreaterThan(0);
    expect(componentResult(result, "Q1").current).toBeLessThanOrEqual(0.1);
  });

  it("reports motor, buzzer, and ultrasonic sensor measurements", () => {
    const circuit = new Circuit("test", "sensor and actuators");
    circuit.addComponent(new DCVoltageSource("V1", 5));
    circuit.addComponent(new DCMotor("M1", 5, 0.01, 1000, 0.1));
    circuit.addComponent(new ActiveBuzzer("BZ1", 5, 0.02));
    circuit.addComponent(new UltrasonicSensor("US1", 2, 400, 10));
    connect(circuit, "W1", "V1", "+", "M1", "+");
    connect(circuit, "W2", "M1", "-", "V1", "-");
    connect(circuit, "W3", "V1", "+", "BZ1", "+");
    connect(circuit, "W4", "BZ1", "-", "V1", "-");
    connect(circuit, "W5", "V1", "+", "US1", "VCC");
    connect(circuit, "W6", "V1", "+", "US1", "TRIG");
    connect(circuit, "W7", "US1", "GND", "V1", "-");

    const result = new DCSolver().simulate(circuit);
    expect(result.success).toBe(true);
    expect(componentResult(result, "M1").current).toBeCloseTo(0.01);
    expect(componentResult(result, "M1").measurements.rpm).toBe(1000);
    expect(componentResult(result, "BZ1").measurements.active).toBe(true);
    expect(componentResult(result, "US1").measurements.echoPulseWidthMicroseconds).toBe(580);

    const outOfRange = circuitWithLoad(0, new UltrasonicSensor("US1", 2, 400, 500), ["VCC", "GND"]);
    connect(outOfRange, "W3", "US1", "TRIG", "V1", "-");
    const inactiveResult = new DCSolver().simulate(outOfRange);
    expect(inactiveResult.success).toBe(true);
    expect(componentResult(inactiveResult, "US1").measurements.triggered).toBe(false);
    expect(componentResult(inactiveResult, "US1").measurements.echoPulseWidthMicroseconds).toBe(0);
  });
});

describe("DC circuit errors", () => {
  it("reports empty and source-free circuits", () => {
    expect(new DCSolver().simulate(new Circuit("test", "empty")).errors[0]).toMatch(/empty/i);
    const circuit = circuitWithLoad(0, new Resistor("R1", 1000));
    circuit.removeComponent("V1");
    expect(new DCSolver().simulate(circuit).errors[0]).toMatch(/source/i);
  });

  it("reports floating and conflicting ideal-source circuits", () => {
    const floating = new Circuit("test", "floating");
    floating.addComponent(new DCVoltageSource("V1", 5));
    floating.addComponent(new Resistor("R1", 1000));
    expect(new DCSolver().simulate(floating).errors[0]).toMatch(/floating nodes/i);

    const shortedSource = new Circuit("test", "shorted source");
    shortedSource.addComponent(new DCVoltageSource("V1", 5));
    connect(shortedSource, "W1", "V1", "+", "V1", "-");
    expect(new DCSolver().simulate(shortedSource).errors[0]).toMatch(/conflicting ideal voltage sources/i);
  });

  it("reports compatible parallel ideal sources as indeterminate current sharing", () => {
    const circuit = new Circuit("test", "parallel sources");
    circuit.addComponent(new DCVoltageSource("V1", 5));
    circuit.addComponent(new DCVoltageSource("V2", 5));
    circuit.addComponent(new Resistor("R1", 1000));
    connect(circuit, "W1", "V1", "+", "V2", "+");
    connect(circuit, "W2", "V1", "-", "V2", "-");
    connect(circuit, "W3", "R1", "1", "V1", "+");
    connect(circuit, "W4", "R1", "2", "V1", "-");

    expect(new DCSolver().simulate(circuit).errors[0]).toMatch(/current sharing is indeterminate/i);

    const conflicting = new Circuit("test", "conflicting parallel sources");
    conflicting.addComponent(new DCVoltageSource("V1", 5));
    conflicting.addComponent(new DCVoltageSource("V2", 3));
    connect(conflicting, "W1", "V1", "+", "V2", "+");
    connect(conflicting, "W2", "V1", "-", "V2", "-");
    expect(new DCSolver().simulate(conflicting).errors[0]).toMatch(/conflicting ideal voltage sources/i);
  });

  it("assigns current deterministically to a spanning tree of redundant ideal links", () => {
    const circuit = new Circuit("test", "parallel switches");
    circuit.addComponent(new DCVoltageSource("V1", 5));
    circuit.addComponent(new Switch("S1", true));
    circuit.addComponent(new Switch("S2", true));
    circuit.addComponent(new Resistor("R1", 1000));
    connect(circuit, "W1", "V1", "+", "S1", "1");
    connect(circuit, "W2", "V1", "+", "S2", "1");
    connect(circuit, "W3", "S1", "2", "R1", "1");
    connect(circuit, "W4", "S2", "2", "R1", "1");
    connect(circuit, "W5", "R1", "2", "V1", "-");

    const result = new DCSolver().simulate(circuit);
    expect(result.success).toBe(true);
    expect(componentResult(result, "S1").current).toBeCloseTo(0.005);
    expect(componentResult(result, "S2").current).toBe(0);
    expectPowerBalance(result);
  });
});

describe("TransientSolver initial conditions and inputs", () => {
  it("uses capacitor initial voltage and inductor initial current", () => {
    const capacitorCircuit = circuitWithLoad(5, new Capacitor("C1", 1e-6, 10));
    const capacitorResult = new TransientSolver().simulate(capacitorCircuit, {
      durationSeconds: 0.001,
      timeStepSeconds: 0.001,
      initialConditions: { capacitorVoltages: { C1: 2 } },
    });
    expect(capacitorResult.success).toBe(true);
    expect(componentResult(capacitorResult.samples[0], "C1").voltage).toBeCloseTo(5);
    expect(componentResult(capacitorResult.samples[0], "C1").current).toBeCloseTo(0.003);

    const inductorCircuit = new Circuit("test", "initial inductor current");
    inductorCircuit.addComponent(new DCVoltageSource("V1", 5));
    inductorCircuit.addComponent(new Resistor("R1", 10));
    inductorCircuit.addComponent(new Inductor("L1", 1));
    connect(inductorCircuit, "W1", "V1", "+", "R1", "1");
    connect(inductorCircuit, "W2", "R1", "2", "L1", "1");
    connect(inductorCircuit, "W3", "L1", "2", "V1", "-");
    const inductorResult = new TransientSolver().simulate(inductorCircuit, {
      durationSeconds: 0.1,
      timeStepSeconds: 0.1,
      initialConditions: { inductorCurrents: { L1: 0.2 } },
    });
    expect(inductorResult.success).toBe(true);
    expect(componentResult(inductorResult.samples[0], "L1").current).toBeCloseTo(0.35);
  });

  it("accepts time-varying source voltage at each sample time", () => {
    const circuit = circuitWithLoad(0, new Resistor("R1", 1000));
    const result = new TransientSolver().simulate(circuit, {
      durationSeconds: 0.003,
      timeStepSeconds: 0.001,
      sourceWaveforms: { V1: time => time < 0.002 ? 0 : 5 },
    });
    expect(result.success).toBe(true);
    expect(result.samples.map(sample => componentResult(sample, "R1").current)).toEqual([0, 0.005, 0.005]);
    expect(result.samples.map(sample => sample.timeSeconds)).toEqual([0.001, 0.002, 0.003]);
  });

  it("approaches the analytical RC response as the time step shrinks", () => {
    const run = timeStepSeconds => {
      const circuit = new Circuit("test", "RC accuracy");
      circuit.addComponent(new DCVoltageSource("V1", 5));
      circuit.addComponent(new Resistor("R1", 1000));
      circuit.addComponent(new Capacitor("C1", 1e-6, 10));
      connect(circuit, "W1", "V1", "+", "R1", "1");
      connect(circuit, "W2", "R1", "2", "C1", "1");
      connect(circuit, "W3", "C1", "2", "V1", "-");
      const result = new TransientSolver().simulate(circuit, { durationSeconds: 0.005, timeStepSeconds });
      expect(result.success).toBe(true);
      return componentResult(result.samples.at(-1), "C1").voltage;
    };
    const exact = 5 * (1 - Math.exp(-5));
    const coarseError = Math.abs(run(0.001) - exact);
    const fineResult = run(0.0001);
    expect(Math.abs(fineResult - exact)).toBeLessThan(coarseError);
    expect(fineResult).toBeCloseTo(exact, 1);
  });

  it("approaches the analytical series-RLC step response as the time step shrinks", () => {
    const run = timeStepSeconds => {
      const circuit = new Circuit("test", "RLC step");
      circuit.addComponent(new DCVoltageSource("V1", 5));
      circuit.addComponent(new Resistor("R1", 10));
      circuit.addComponent(new Inductor("L1", 1));
      circuit.addComponent(new Capacitor("C1", 0.001, 10));
      connect(circuit, "W1", "V1", "+", "R1", "1");
      connect(circuit, "W2", "R1", "2", "L1", "1");
      connect(circuit, "W3", "L1", "2", "C1", "1");
      connect(circuit, "W4", "C1", "2", "V1", "-");
      const result = new TransientSolver().simulate(circuit, { durationSeconds: 0.2, timeStepSeconds });
      expect(result.success).toBe(true);
      return componentResult(result.samples.at(-1), "C1").voltage;
    };
    const alpha = 10 / (2 * 1);
    const dampedFrequency = Math.sqrt(1 / (1 * 0.001) - alpha ** 2);
    const time = 0.2;
    const exact = 5 * (1 - Math.exp(-alpha * time) * (
      Math.cos(dampedFrequency * time) + alpha / dampedFrequency * Math.sin(dampedFrequency * time)
    ));
    const coarseError = Math.abs(run(0.001) - exact);
    const fineResult = run(0.0001);
    expect(Math.abs(fineResult - exact)).toBeLessThan(coarseError);
    expect(fineResult).toBeCloseTo(exact, 1);
  });

  it("rejects invalid initial conditions and invalid waveform values", () => {
    const capacitorCircuit = circuitWithLoad(5, new Capacitor("C1", 1e-6, 10));
    const unknownState = new TransientSolver().simulate(capacitorCircuit, {
      durationSeconds: 0.001,
      timeStepSeconds: 0.001,
      initialConditions: { capacitorVoltages: { missing: 1 } },
    });
    expect(unknownState.success).toBe(false);
    expect(unknownState.errors[0]).toMatch(/unknown capacitor/i);

    const nonFiniteState = new TransientSolver().simulate(capacitorCircuit, {
      durationSeconds: 0.001,
      timeStepSeconds: 0.001,
      initialConditions: { capacitorVoltages: { C1: Infinity } },
    });
    expect(nonFiniteState.errors[0]).toMatch(/finite/i);

    const invalidWaveform = new TransientSolver().simulate(capacitorCircuit, {
      durationSeconds: 0.001,
      timeStepSeconds: 0.001,
      sourceWaveforms: { V1: () => NaN },
    });
    expect(invalidWaveform.success).toBe(false);
    expect(invalidWaveform.errors[0]).toMatch(/non-finite/i);
  });

  it("rejects waveform entries for unknown sources", () => {
    const circuit = circuitWithLoad(5, new Resistor("R1", 1000));
    const result = new TransientSolver().simulate(circuit, {
      durationSeconds: 0.001,
      timeStepSeconds: 0.001,
      sourceWaveforms: { missing: () => 1 },
    });
    expect(result.success).toBe(false);
    expect(result.errors[0]).toMatch(/unknown source/i);
  });
});

describe("TransientSolver component models", () => {
  it("applies switch and potentiometer waveforms over time", () => {
    const switchCircuit = new Circuit("test", "switch waveform");
    switchCircuit.addComponent(new DCVoltageSource("V1", 5));
    switchCircuit.addComponent(new Switch("S1", false));
    switchCircuit.addComponent(new Resistor("R1", 1000));
    connect(switchCircuit, "W1", "V1", "+", "S1", "1");
    connect(switchCircuit, "W2", "S1", "2", "R1", "1");
    connect(switchCircuit, "W3", "R1", "2", "V1", "-");
    const switchResult = new TransientSolver().simulate(switchCircuit, {
      durationSeconds: 0.003,
      timeStepSeconds: 0.001,
      controlWaveforms: { switchClosed: { S1: time => time >= 0.002 } },
    });
    expect(switchResult.success).toBe(true);
    expect(switchResult.samples.map(sample => componentResult(sample, "R1").current)).toEqual([0, 0.005, 0.005]);

    const potCircuit = new Circuit("test", "pot waveform");
    potCircuit.addComponent(new DCVoltageSource("V1", 10));
    potCircuit.addComponent(new Potentiometer("P1", 10000));
    connect(potCircuit, "W1", "V1", "+", "P1", "A");
    connect(potCircuit, "W2", "P1", "B", "V1", "-");
    const potResult = new TransientSolver().simulate(potCircuit, {
      durationSeconds: 0.002,
      timeStepSeconds: 0.001,
      controlWaveforms: { potentiometerPositions: { P1: time => time < 0.002 ? 0.25 : 0.75 } },
    });
    expect(potResult.success).toBe(true);
    expect(potResult.samples.map(sample => nodeVoltage(potCircuit, sample, "P1", "W"))).toEqual([7.5, 2.5]);
  });

  it("applies push-button and LDR waveforms over time", () => {
    const buttonCircuit = new Circuit("test", "button waveform");
    buttonCircuit.addComponent(new DCVoltageSource("V1", 5));
    buttonCircuit.addComponent(new PushButton("PB1"));
    buttonCircuit.addComponent(new Resistor("R1", 1000));
    connect(buttonCircuit, "W1", "V1", "+", "PB1", "1");
    connect(buttonCircuit, "W2", "PB1", "2", "R1", "1");
    connect(buttonCircuit, "W3", "R1", "2", "V1", "-");
    const buttonResult = new TransientSolver().simulate(buttonCircuit, {
      durationSeconds: 0.002,
      timeStepSeconds: 0.001,
      controlWaveforms: { pushButtonPressed: { PB1: time => time >= 0.002 } },
    });
    expect(buttonResult.success).toBe(true);
    expect(buttonResult.samples.map(sample => componentResult(sample, "R1").current)).toEqual([0, 0.005]);

    const ldrCircuit = circuitWithLoad(10, new LDR("LDR1", 10000, 10, 1, 10));
    const ldrResult = new TransientSolver().simulate(ldrCircuit, {
      durationSeconds: 0.002,
      timeStepSeconds: 0.001,
      controlWaveforms: { ldrIlluminanceLux: { LDR1: time => time < 0.002 ? 10 : 20 } },
    });
    expect(ldrResult.success).toBe(true);
    expect(ldrResult.samples.map(sample => componentResult(sample, "LDR1").current)).toEqual([0.001, 0.002]);
  });

  it("simulates diode conduction in response to a changing source", () => {
    const circuit = new Circuit("test", "diode switching");
    circuit.addComponent(new DCVoltageSource("V1", 0));
    circuit.addComponent(new Resistor("R1", 1000));
    circuit.addComponent(new Diode("D1"));
    connect(circuit, "W1", "V1", "+", "R1", "1");
    connect(circuit, "W2", "R1", "2", "D1", "A");
    connect(circuit, "W3", "D1", "K", "V1", "-");
    const result = new TransientSolver().simulate(circuit, {
      durationSeconds: 0.002,
      timeStepSeconds: 0.001,
      sourceWaveforms: { V1: time => time < 0.002 ? 0 : 5 },
    });
    expect(result.success).toBe(true);
    expect(componentResult(result.samples[0], "D1").current).toBe(0);
    expect(componentResult(result.samples[1], "D1").voltage).toBeCloseTo(0.7, 2);
    expect(componentResult(result.samples[1], "D1").current).toBeCloseTo(0.004295, 4);

    const ledCircuit = new Circuit("test", "LED switching");
    ledCircuit.addComponent(new DCVoltageSource("V1", 0));
    ledCircuit.addComponent(new Resistor("R1", 1000));
    ledCircuit.addComponent(new LED("LED1", "red", 2, 0.002));
    connect(ledCircuit, "W1", "V1", "+", "R1", "1");
    connect(ledCircuit, "W2", "R1", "2", "LED1", "A");
    connect(ledCircuit, "W3", "LED1", "K", "V1", "-");
    const ledResult = new TransientSolver().simulate(ledCircuit, {
      durationSeconds: 0.002,
      timeStepSeconds: 0.001,
      sourceWaveforms: { V1: time => time < 0.002 ? 0 : 5 },
    });
    expect(ledResult.success).toBe(true);
    expect(componentResult(ledResult.samples[1], "LED1").measurements.maxForwardCurrentExceeded).toBe(true);
  });

  it("rejects out-of-range control waveform values", () => {
    const circuit = new Circuit("test", "invalid control input");
    circuit.addComponent(new DCVoltageSource("V1", 10));
    circuit.addComponent(new Potentiometer("P1", 10000));
    connect(circuit, "W1", "V1", "+", "P1", "A");
    connect(circuit, "W2", "P1", "B", "V1", "-");
    const result = new TransientSolver().simulate(circuit, {
      durationSeconds: 0.001,
      timeStepSeconds: 0.001,
      controlWaveforms: { potentiometerPositions: { P1: () => 1.5 } },
    });
    expect(result.success).toBe(false);
    expect(result.errors[0]).toMatch(/potentiometer position/i);
  });

  it("updates BJT conduction in response to base drive", () => {
    const circuit = new Circuit("test", "BJT waveform");
    circuit.addComponent(new DCVoltageSource("VCC", 5));
    circuit.addComponent(new DCVoltageSource("VB", 0));
    circuit.addComponent(new Resistor("RB", 1000));
    circuit.addComponent(new Resistor("RC", 100));
    circuit.addComponent(new Transistor("Q1", "NPN", 100, 0.1, 50));
    connect(circuit, "W1", "VB", "+", "RB", "1");
    connect(circuit, "W2", "RB", "2", "Q1", "B");
    connect(circuit, "W3", "VCC", "+", "RC", "1");
    connect(circuit, "W4", "RC", "2", "Q1", "C");
    connect(circuit, "W5", "Q1", "E", "VCC", "-");
    connect(circuit, "W6", "VB", "-", "VCC", "-");
    const result = new TransientSolver().simulate(circuit, {
      durationSeconds: 0.002,
      timeStepSeconds: 0.001,
      sourceWaveforms: { VB: time => time < 0.002 ? 0 : 5 },
    });
    expect(result.success).toBe(true);
    expect(componentResult(result.samples[0], "Q1").measurements.conducting).toBe(false);
    expect(componentResult(result.samples[1], "Q1").measurements.conducting).toBe(true);
    expect(componentResult(result.samples[1], "Q1").current).toBeGreaterThan(0);
  });

  it("updates motor and buzzer measurements at each transient sample", () => {
    const circuit = new Circuit("test", "actuator waveform");
    circuit.addComponent(new DCVoltageSource("V1", 0));
    circuit.addComponent(new DCMotor("M1", 5, 0.01, 1000, 0.1));
    circuit.addComponent(new ActiveBuzzer("BZ1", 5, 0.02));
    connect(circuit, "W1", "V1", "+", "M1", "+");
    connect(circuit, "W2", "M1", "-", "V1", "-");
    connect(circuit, "W3", "V1", "+", "BZ1", "+");
    connect(circuit, "W4", "BZ1", "-", "V1", "-");
    const result = new TransientSolver().simulate(circuit, {
      durationSeconds: 0.002,
      timeStepSeconds: 0.001,
      sourceWaveforms: { V1: time => time < 0.002 ? 0 : 5 },
    });
    expect(result.success).toBe(true);
    expect(componentResult(result.samples[0], "M1").measurements.rpm).toBe(0);
    expect(componentResult(result.samples[1], "M1").measurements.rpm).toBe(1000);
    expect(componentResult(result.samples[0], "BZ1").measurements.active).toBe(false);
    expect(componentResult(result.samples[1], "BZ1").measurements.active).toBe(true);
  });

  it("emits a timed ultrasonic echo pulse after a trigger edge", () => {
    const circuit = new Circuit("test", "ultrasonic pulse");
    circuit.addComponent(new DCVoltageSource("VCC", 5));
    circuit.addComponent(new DCVoltageSource("TRIGSRC", 0));
    circuit.addComponent(new UltrasonicSensor("US1", 2, 400, 5));
    connect(circuit, "W1", "VCC", "+", "US1", "VCC");
    connect(circuit, "W2", "US1", "GND", "VCC", "-");
    connect(circuit, "W3", "TRIGSRC", "+", "US1", "TRIG");
    connect(circuit, "W4", "TRIGSRC", "-", "VCC", "-");
    const result = new TransientSolver().simulate(circuit, {
      durationSeconds: 0.0005,
      timeStepSeconds: 0.0001,
      sourceWaveforms: { TRIGSRC: time => time >= 0.0002 && time < 0.0003 ? 5 : 0 },
    });
    expect(result.success).toBe(true);
    expect(result.samples.map(sample => componentResult(sample, "US1").measurements.triggered)).toEqual([false, true, true, true, false]);
    expect(result.samples[1].components.find(item => item.componentId === "US1").voltage).toBeCloseTo(5);
    expect(componentResult(result.samples[1], "US1").measurements.echoPulseWidthMicroseconds).toBe(290);
  });
});

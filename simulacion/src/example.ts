
import { Circuit } from "./core/Circuit.ts";
import { Connection } from "./core/Conection.ts";
import { Resistor } from "./components/passive/Resistor.ts";
import { DCVoltageSource } from "./components/sources/DCVoltageSource.ts";
import { DCSolver } from "./simulation/DCSolver.ts";

const circuit = new Circuit("C1", "Voltage Divider");

circuit.addComponent(
    new DCVoltageSource("V1", 12, 1)
);

circuit.addComponent(
    new Resistor("R1", 1000)
);

circuit.addComponent(
    new Resistor("R2", 2000)
);

// Fuente positiva -> R1
circuit.addConnection(
    new Connection(
        "W1",
        { componentId: "V1", terminalId: "+" },
        { componentId: "R1", terminalId: "1" }
    )
);

// R1 -> R2
circuit.addConnection(
    new Connection(
        "W2",
        { componentId: "R1", terminalId: "2" },
        { componentId: "R2", terminalId: "1" }
    )
);

// R2 -> Fuente negativa
circuit.addConnection(
    new Connection(
        "W3",
        { componentId: "R2", terminalId: "2" },
        { componentId: "V1", terminalId: "-" }
    )
);

// Ejecutar simulación
const solver = new DCSolver();
const result = solver.simulate(circuit);

if (result.success) {
    console.table(result.nodes);
    console.table(result.components);
} else {
    console.error(result.errors);
}
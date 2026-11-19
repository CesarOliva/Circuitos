import { Circuit } from "./core/Circuit.ts"; 
import { Connection } from "./core/Conection.ts";

import { DCVoltageSource } from "./components/sources/DCVoltageSource.ts";
import { Resistor } from "./components/passive/Resistor.ts";
import { LED } from "./components/semiconductors/LED.ts";

const circuit = new Circuit("C1", "LED Circuit");

// 1. Crear componentes
const source = new DCVoltageSource("V1", 5, 1);
const resistor = new Resistor("R1", 220);
const led = new LED("D1", "red", 2, 0.02);

// 2. Agregar componentes
circuit.addComponent(source);
circuit.addComponent(resistor);
circuit.addComponent(led);

// 3. Conectar componentes
// Usar los IDs de terminal declarados en cada clase.
// Aquí se asume que la fuente usa "+" y "-".
circuit.addConnection(
    new Connection(
        "W1",
        { componentId: "V1", terminalId: "+" },
        { componentId: "R1", terminalId: "1" }
    )
);

circuit.addConnection(
    new Connection(
        "W2",
        { componentId: "R1", terminalId: "2" },
        { componentId: "D1", terminalId: "A" }
    )
);

circuit.addConnection(
    new Connection(
        "W3",
        { componentId: "D1", terminalId: "K" },
        { componentId: "V1", terminalId: "-" }
    )
);

// 4. Consultar circuito
console.log(circuit.getComponents());
console.log(circuit.getConnections());
console.log(circuit.getNodes());
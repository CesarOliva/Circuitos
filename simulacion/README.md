# Simulador de circuitos (TypeScript)

Biblioteca para construir circuitos con componentes tipados y resolver su comportamiento eléctrico en DC o en el tiempo.

## Desarrollo

```bash
npm install
npm run typecheck
npm test
npm run build
node dist/example.js
```

## Análisis DC

`DCSolver.simulate(circuit)` devuelve voltajes de nodo y voltaje, corriente y potencia por componente. Un resultado fallido incluye el motivo en `errors`. En circuitos no lineales, el solver itera los estados hasta converger o reporta el fallo.

Los componentes se aproximan así:

- Fuente DC ideal y resistor ideal con sus valores configurados.
- Switch y push button como conexiones ideales cuando están cerrados. En lazos redundantes de conexiones ideales, la distribución de corriente no es única; la corriente reportada corresponde a una base independiente de restricciones.
- Potenciómetro como dos resistencias y LDR con su ley configurable.
- Capacitor abierto en estado estacionario; inductor reemplazado por su resistencia serie.
- Diodo y LED con caída nominal y resistencia de conducción pequeña.
- BJT con umbral base-emisor, ganancia beta y una rama colector-emisor equivalente limitada por sus valores nominales.
- Motor como carga resistiva aproximada; RPM escala con el voltaje aplicado.
- Buzzer como carga resistiva nominal; `measurements.active` indica si alcanza su voltaje nominal.
- Sensor ultrasónico con salida ECHO a nivel VCC cuando TRIG alcanza 2.5 V y la distancia está dentro del rango configurado. El ancho de pulso reportado es 58 µs por cm.

`ComponentResult.measurements` es opcional y contiene estados derivados o indicadores como `ratedPowerExceeded`, `conducting`, `rpm`, `triggered` y `echoPulseWidthMicroseconds`. Estos modelos son educativos, no equivalen a hojas de datos de fabricantes.

## Análisis transitorio

`TransientSolver.simulate(circuit, { durationSeconds, timeStepSeconds })` devuelve muestras con voltajes, corrientes y potencias a lo largo del tiempo. Usa Euler implícito para resistores, fuentes DC, capacitores e inductores; los estados iniciales del capacitor y del inductor son cero. El análisis admite hasta 100 000 pasos y reporta error si recibe otro tipo de componente.

## Ejemplo

```ts
import { Circuit, Connection, DCSolver, DCVoltageSource, Resistor } from "./index.ts";

const circuit = new Circuit("C1", "Divisor");
circuit.addComponent(new DCVoltageSource("V1", 12));
circuit.addComponent(new Resistor("R1", 1_000));
circuit.addComponent(new Resistor("R2", 2_000));
circuit.addConnection(new Connection("W1", { componentId: "V1", terminalId: "+" }, { componentId: "R1", terminalId: "1" }));
circuit.addConnection(new Connection("W2", { componentId: "R1", terminalId: "2" }, { componentId: "R2", terminalId: "1" }));
circuit.addConnection(new Connection("W3", { componentId: "R2", terminalId: "2" }, { componentId: "V1", terminalId: "-" }));

const result = new DCSolver().simulate(circuit);
```

Las clases del núcleo, componentes y solucionadores se exportan desde `src/index.ts`.
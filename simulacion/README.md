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

Los errores distinguen nodos flotantes, fuentes ideales incompatibles y restricciones de voltaje redundantes. Fuentes ideales paralelas con reparto de corriente indeterminado se reportan como error, aunque sus voltajes coincidan.

Los componentes se aproximan así:

- Fuente DC ideal y resistor ideal con sus valores configurados.
- Switch y push button como conexiones ideales cuando están cerrados. Las conexiones redundantes se reducen a un árbol determinista según el orden de componentes; los enlaces redundantes reportan corriente cero porque el reparto ideal no es único.
- Potenciómetro como dos resistencias y LDR con su ley configurable.
- Capacitor abierto en estado estacionario; inductor reemplazado por su resistencia serie.
- Diodo y LED con caída nominal y resistencia de conducción pequeña.
- BJT con umbral base-emisor, ganancia beta y una rama colector-emisor equivalente limitada por sus valores nominales.
- Motor como carga resistiva aproximada; RPM escala con el voltaje aplicado.
- Buzzer como carga resistiva nominal; `measurements.active` indica si alcanza su voltaje nominal.
- Sensor ultrasónico con salida ECHO a nivel VCC cuando TRIG alcanza 2.5 V y la distancia está dentro del rango configurado. El ancho de pulso reportado es 58 µs por cm.

`ComponentResult.measurements` es opcional y contiene estados derivados o indicadores como `ratedPowerExceeded`, `conducting`, `rpm`, `triggered` y `echoPulseWidthMicroseconds`. Estos modelos son educativos, no equivalen a hojas de datos de fabricantes.

## Análisis transitorio

`TransientSolver.simulate(circuit, options)` devuelve muestras con voltajes, corrientes, potencias y mediciones por paso. Soporta todos los componentes declarados, resuelve diodos, LED y BJT mediante iteraciones por paso, y usa Euler implícito para resistores, fuentes, capacitores e inductores. Admite hasta 100 000 pasos. Los estados iniciales son cero por omisión y se pueden proporcionar por ID:

```ts
import { TransientSolver } from "./index.ts";

new TransientSolver().simulate(circuit, {
  durationSeconds: 0.1,
  timeStepSeconds: 0.001,
  initialConditions: {
    capacitorVoltages: { C1: 2 },
    inductorCurrents: { L1: 0.1 },
  },
  sourceWaveforms: {
    V1: timeSeconds => timeSeconds < 0.01 ? 0 : 5,
  },
  controlWaveforms: {
    switchClosed: { S1: timeSeconds => timeSeconds >= 0.02 },
    potentiometerPositions: { P1: timeSeconds => timeSeconds < 0.05 ? 0.25 : 0.75 },
    ldrIlluminanceLux: { LDR1: timeSeconds => 10 + 20 * timeSeconds },
  },
});
```

Los estados de switch, pulsador, potenciómetro y LDR se conservan desde el componente si no se proporciona una forma de onda. También se puede variar la distancia con `ultrasonicDistancesCm` y el estado del pulsador con `pushButtonPressed`. Las funciones se evalúan al final de cada paso; los valores no válidos y los IDs que no corresponden a un componente del tipo correcto producen un error.

El sensor ultrasónico inicia un pulso ECHO ante cada flanco ascendente válido de TRIG y lo mantiene durante 58 µs por cm. El motor reporta RPM instantáneas proporcionales al voltaje y el buzzer cambia al cruzar su voltaje nominal; no se simulan inercia mecánica ni propagación acústica. El paso fijo limita la resolución temporal de controles y pulsos cortos.

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

## Microcontroladores

`runSketch()` compila y ejecuta sketches Arduino C++ para Arduino Uno R3 y ESP32 DevKit V1. Recibe las entradas digitales como `Record<pin, boolean | SignalPoint<boolean>[]>`; las entradas analógicas del Uno usan canales `0..5` y las del ESP32 usan números GPIO. `outputSources` enlaza pines de salida con fuentes `DCVoltageSource` del circuito para calcular la respuesta eléctrica transitoria.

El motor requiere Arduino CLI con los cores `arduino:avr` y `esp32:esp32`. La emulación Uno se ejecuta con `avr8js`; ESP32 usa el binario local `esp32sim`. Configura `ARDUINO_CLI_PATH` y `ESP32SIM_PATH` si no están en `PATH`. El emulador ESP32 necesita además sus archivos ROM locales (`ESP32SIM_ROM_DIR` o la ubicación por defecto de `esp32sim`). No se llama a servicios alojados.

```ts
const result = await runSketch({
  board: "arduino-uno-r3",
  sketch: "void setup() { pinMode(13, OUTPUT); } void loop() { digitalWrite(13, HIGH); delay(500); digitalWrite(13, LOW); delay(500); }",
  durationSeconds: 2,
});
```

Cada ejecución usa un directorio temporal, tiene límites de código, duración, salida y concurrencia, y se puede cancelar con `AbortSignal`. Wi-Fi, Bluetooth y bibliotecas Arduino adicionales no forman parte de esta primera versión.

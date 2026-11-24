import type { Ficha } from "./tipos";

export const ficha: Ficha = {
  slug: "ultrasonic",
  titulo: "Sensor ultrasónico HC-SR04",
  grupo: "Sensores",
  clase: "UltrasonicSensor",
  archivo: "simulacion/src/components/sensors/UltrasonicSensor.ts",
  resumen: "Mide distancia con el eco de un pulso de ultrasonido de 40 kHz.",
  descripcion: [
    "Al recibir un pulso en TRIG emite ultrasonido y pone ECHO en alto el tiempo que tarda el sonido en ir y volver. La distancia en cm es aproximadamente el ancho del pulso en µs dividido entre 58.",
    "Se usa en robots que evitan obstáculos, medidores de nivel y sensores de estacionamiento.",
  ],
  especificaciones: [
    { parametro: "Alimentación", simulador: "La que reciba VCC: no comprueba ningún mínimo", real: "5 V DC; ~15 mA. El HC-SR04 clásico no funciona de forma fiable a 3.3 V" },
    { parametro: "Rango de medición", simulador: "2 a 400 cm", real: "2 a 400 cm" },
    { parametro: "Distancia simulada", simulador: "100 cm en el playground (editable); 50 cm en la galería", real: "—" },
    { parametro: "Disparo (TRIG)", simulador: "Activo si V(TRIG) ≥ 2.5 V", real: "Pulso TTL de 10 µs" },
    { parametro: "Pulso de eco", simulador: "distancia × 58 µs", real: "≈ 58 µs/cm (a ~343 m/s)" },
    { parametro: "Frecuencia ultrasónica", simulador: "—", real: "40 kHz" },
  ],
  pines: [
    { id: "VCC", nombre: "Alimentación", funcion: "+5 V." },
    { id: "TRIG", nombre: "Disparo", funcion: "Entrada: un pulso inicia la medición." },
    { id: "ECHO", nombre: "Eco", funcion: "Salida: alto durante el tiempo de vuelo. Su nivel es el de VCC (5 V), así que a un ESP32 de 3.3 V debe llegar a través de un divisor." },
    { id: "GND", nombre: "Tierra", funcion: "Referencia." },
  ],
  simulador: {
    modelo: [
      "No consume corriente. Si V(TRIG) ≥ 2.5 V y la distancia está dentro del rango, ECHO se fuerza al voltaje VCC − GND con una fuente ideal; si no, ECHO queda en 0 V respecto de GND.",
      "El ancho del pulso no se genera en el tiempo: se reporta como medida.",
    ],
    editable: "Distancia al objeto en cm.",
    lecturas: [
      { clave: "triggered", significado: "Si hubo eco válido." },
      { clave: "echoPulseWidthMicroseconds", significado: "distancia × 58 µs, o 0 sin eco." },
      { clave: "distanceCm", significado: "Distancia configurada." },
    ],
    limitaciones: [
      "Es estático: TRIG en alto equivale a una medición continua.",
      "Sin ángulo de detección, ruido ni ecos falsos.",
      "No exige 5 V en VCC ni limita la corriente de ECHO: en el simulador ECHO es una fuente ideal, mientras que la salida real solo entrega unos pocos mA.",
    ],
  },
  pruebas: [
    {
      titulo: "Eco visible con un LED",
      montaje: "Batería 5 V: VCC y TRIG a +, GND a −. ECHO → 470 Ω → LED → −.",
      pasos: ["Ajusta la distancia a 100 cm y simula."],
      esperado: "triggered = sí, pulso de 5800 µs y LED encendido (≈6.2 mA).",
    },
    {
      titulo: "Fuera de rango",
      montaje: "El mismo circuito.",
      pasos: ["Ajusta la distancia a 1 cm y simula.", "Repite con 450 cm."],
      esperado: "En ambos casos triggered = no, pulso de 0 µs y LED apagado.",
    },
    {
      titulo: "Sin disparo",
      montaje: "TRIG conectado a − en lugar de a +.",
      pasos: ["Simula."],
      esperado: "Sin eco: ECHO a 0 V.",
    },
  ],
  fallos: [
    { fallo: "Sin alimentación o GND suelto", efecto: "No mide; ECHO no cambia." },
    { fallo: "TRIG sin pulso", efecto: "Nunca inicia la medición." },
    { fallo: "Objeto blando o inclinado", efecto: "El eco se pierde: lecturas máximas o tiempos de espera agotados." },
    { fallo: "ECHO de 5 V directo a un ESP32", efecto: "Puede dañar el GPIO de 3.3 V." },
  ],
  referencias: [{ texto: "Guía del módulo HC-SR04", url: "https://hetpro-store.com/PDFs/HC-SR04.pdf" }],
};

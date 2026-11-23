import type { Ficha } from "./tipos";

export const ficha: Ficha = {
  slug: "arduino-uno-r3",
  titulo: "Arduino UNO R3",
  grupo: "Microcontroladores",
  clase: "runSketch({ board: \"arduino-uno-r3\" })",
  archivo: "simulacion/src/microcontrollers/uno.ts",
  resumen: "Placa con microcontrolador ATmega328P a 5 V y 16 MHz; la más usada para aprender.",
  descripcion: [
    "El Arduino UNO R3 se programa en C++ con el IDE de Arduino (sketch con setup() y loop()). Tiene 14 pines digitales, 6 entradas analógicas y comunicación serie por USB.",
    "En el simulador el sketch se compila con Arduino CLI (FQBN arduino:avr:uno) y el firmware resultante se ejecuta instrucción por instrucción en un ATmega328P emulado con avr8js.",
  ],
  especificaciones: [
    { parametro: "Microcontrolador", simulador: "ATmega328P emulado (avr8js)", real: "ATmega328P" },
    { parametro: "Voltaje de operación (lógica)", simulador: "5 V (un pin en HIGH = 5 V)", real: "5 V" },
    { parametro: "Voltaje de entrada (VIN / jack)", simulador: "—", real: "7–12 V recomendado" },
    { parametro: "Reloj", simulador: "16 MHz", real: "16 MHz" },
    { parametro: "Pines digitales", simulador: "0–13, más A0–A5 como 14–19", real: "14 (6 con PWM: 3, 5, 6, 9, 10, 11)" },
    { parametro: "Entradas analógicas", simulador: "Canales 0–5, de 0 a 5 V; ADC de 10 bits (0–1023)", real: "A0–A5, ADC de 10 bits" },
    { parametro: "Corriente por pin", simulador: "No se limita", real: "20 mA recomendado; 40 mA máximo absoluto" },
    { parametro: "Memoria", simulador: "Flash de 16 K palabras (32 KB)", real: "Flash 32 KB (0.5 KB de bootloader), SRAM 2 KB, EEPROM 1 KB" },
    { parametro: "Puerto serie", simulador: "USART0 capturado como texto", real: "UART por USB (pines 0 y 1)" },
  ],
  pines: [
    { id: "D0 / RX", nombre: "Digital 0", funcion: "Recepción serie; evítalo si usas Serial." },
    { id: "D1 / TX", nombre: "Digital 1", funcion: "Transmisión serie." },
    { id: "D2, D4, D7, D8", nombre: "Digitales", funcion: "E/S digital. D2 y D3 admiten interrupciones externas." },
    { id: "D3, D5, D6, D9, D10, D11", nombre: "Digitales con PWM (~)", funcion: "analogWrite(); D10–D13 también son el bus SPI." },
    { id: "D12 / D13", nombre: "Digitales (MISO / SCK)", funcion: "D13 lleva el LED integrado «L»." },
    { id: "A0–A5", nombre: "Analógicas (pines 14–19)", funcion: "analogRead() o E/S digital. A4 = SDA y A5 = SCL (I²C)." },
    { id: "5V / 3.3V", nombre: "Salidas de alimentación", funcion: "5 V regulados; 3.3 V hasta 50 mA." },
    { id: "VIN", nombre: "Entrada de alimentación", funcion: "7–12 V hacia el regulador." },
    { id: "GND", nombre: "Tierra", funcion: "Referencia común con el resto del circuito." },
    { id: "RESET / AREF / IOREF", nombre: "Control", funcion: "Reinicio, referencia del ADC y nivel lógico de la placa." },
  ],
  simulador: {
    modelo: [
      "runSketch() compila el sketch, carga el .hex en un CPU AVR emulado con temporizadores 0–2, ADC y USART0, y lo ejecuta en bloques de 16 000 ciclos.",
      "Registra cada cambio de los pines 0–19 como un evento {tiempo, pin, modo, voltaje}: output a 0 o 5 V, input o input-pullup.",
      "Las entradas digitales y analógicas se inyectan como valores fijos o como señales en el tiempo. Con outputSources, un pin de salida controla una DCVoltageSource del circuito y el TransientSolver calcula la respuesta eléctrica.",
    ],
    editable: "Sketch, duración (por defecto 3 s, máximo 10 s), entradas y paso de tiempo del circuito.",
    lecturas: [
      { clave: "pins", significado: "Cambios de modo y voltaje de cada pin." },
      { clave: "serial", significado: "Texto enviado con Serial.print, con su marca de tiempo." },
      { clave: "circuitSamples", significado: "Voltajes y corrientes del circuito en cada paso de tiempo." },
      { clave: "diagnostics", significado: "Errores y avisos de compilación con su línea." },
    ],
    limitaciones: [
      "Todavía no se puede arrastrar al playground: se usa desde la API runSketch() de simulacion/.",
      "Necesita Arduino CLI con el core arduino:avr instalado (ARDUINO_CLI_PATH).",
      "Solo bibliotecas del core; sin I²C/SPI con periféricos simulados. Como máximo 2 ejecuciones simultáneas.",
    ],
  },
  pruebas: [
    {
      titulo: "Blink en el pin 13",
      montaje: "Solo la placa.",
      pasos: ["Ejecuta runSketch con el sketch durante 2 s.", "Revisa los eventos del pin 13."],
      esperado: "El pin 13 alterna entre 5 V y 0 V cada 0.5 s (unos 4 cambios en 2 s).",
      codigo: `await runSketch({
  board: "arduino-uno-r3",
  durationSeconds: 2,
  sketch: \`void setup() { pinMode(13, OUTPUT); }
void loop() { digitalWrite(13, HIGH); delay(500); digitalWrite(13, LOW); delay(500); }\`,
});`,
    },
    {
      titulo: "Lectura analógica y Serial",
      montaje: "2.5 V inyectados en el canal A0.",
      pasos: ["Ejecuta el sketch con inputs.analog = { 0: 2.5 }.", "Lee la salida serie."],
      esperado: "El monitor serie muestra valores ≈ 511–512 (2.5 V / 5 V × 1023).",
      codigo: `await runSketch({
  board: "arduino-uno-r3",
  inputs: { analog: { 0: 2.5 } },
  sketch: \`void setup() { Serial.begin(9600); }
void loop() { Serial.println(analogRead(A0)); delay(200); }\`,
});`,
    },
    {
      titulo: "Botón con INPUT_PULLUP",
      montaje: "Entrada digital en el pin 2 que pasa a LOW a los 1 s.",
      pasos: [
        "Inyecta inputs.digital = { 2: [{ timeSeconds: 0, value: true }, { timeSeconds: 1, value: false }] } (botón suelto y luego presionado).",
        "En loop(): digitalWrite(13, digitalRead(2) == LOW ? HIGH : LOW).",
      ],
      esperado: "El pin 13 se mantiene en 0 V y pasa a 5 V alrededor de t = 1 s, cuando el «botón» lleva el pin 2 a LOW.",
    },
  ],
  fallos: [
    { fallo: "Más de 40 mA en un pin (LED sin resistencia, motor directo)", efecto: "Daña el puerto del ATmega328P." },
    { fallo: "Entrada flotante sin pull-up ni pull-down", efecto: "Lecturas aleatorias." },
    { fallo: "Usar D0/D1 con Serial activo", efecto: "Interferencias con la carga del programa y la comunicación." },
    { fallo: "Más de 5.5 V en un pin", efecto: "Destruye la entrada." },
    { fallo: "GND no común con la fuente externa", efecto: "Las señales no tienen referencia: el circuito no responde." },
  ],
  referencias: [{ texto: "Documentación oficial del Arduino UNO R3", url: "https://docs.arduino.cc/hardware/uno-rev3/" }],
};

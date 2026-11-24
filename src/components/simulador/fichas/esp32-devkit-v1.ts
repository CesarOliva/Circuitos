import type { Ficha } from "./tipos";

export const ficha: Ficha = {
  slug: "esp32-devkit-v1",
  titulo: "ESP32 DevKit V1",
  grupo: "Microcontroladores",
  clase: "runSketch({ board: \"esp32-devkit-v1\" })",
  archivo: "simulacion/src/microcontrollers/esp32.ts",
  resumen: "Placa con ESP32 de doble núcleo a 240 MHz, lógica de 3.3 V, Wi-Fi y Bluetooth.",
  descripcion: [
    "La DevKit V1 monta un módulo ESP32-WROOM-32. Es mucho más potente que el UNO y se programa con el mismo lenguaje de Arduino (core esp32:esp32).",
    "Su lógica es de 3.3 V y sus pines no toleran 5 V. En el simulador se compila con Arduino CLI y se ejecuta en el emulador local esp32sim.",
  ],
  especificaciones: [
    { parametro: "Microcontrolador", simulador: "ESP32 emulado (esp32sim, placa esp32dev)", real: "ESP32-D0WD (Xtensa LX6 de doble núcleo)" },
    { parametro: "Voltaje lógico", simulador: "3.3 V (un pin en HIGH = 3.3 V)", real: "3.3 V; no tolera 5 V" },
    { parametro: "Alimentación", simulador: "—", real: "5 V por USB o VIN" },
    { parametro: "Reloj", simulador: "240 MHz", real: "Hasta 240 MHz" },
    { parametro: "Entradas analógicas", simulador: "GPIO 32, 33, 34, 35, 36 y 39; de 0 a 3.3 V; ADC de 12 bits (0–4095)", real: "ADC1 de 12 bits. Con la atenuación de 11 dB el rango útil y lineal es menor que 0–3.3 V (≈0.15–2.45 V según Espressif). ADC2 no se puede usar con Wi-Fi activo" },
    { parametro: "Memoria", simulador: "—", real: "520 KB de SRAM; 4 MB de flash" },
    { parametro: "Conectividad", simulador: "No se simula", real: "Wi-Fi 802.11 b/g/n y Bluetooth 4.2 / BLE" },
    { parametro: "Corriente por GPIO", simulador: "No se limita", real: "~20 mA recomendado (40 mA máximo)" },
  ],
  pines: [
    { id: "GPIO 2", nombre: "LED integrado", funcion: "LED azul de la placa; buena salida para pruebas. También es pin de arranque: con cargas fuertes puede impedir la programación." },
    { id: "GPIO 0", nombre: "BOOT", funcion: "Pin de arranque unido al botón BOOT: en bajo al reiniciar, la placa entra en modo de programación." },
    { id: "GPIO 4, 5, 12–19, 23, 25–27", nombre: "E/S digital", funcion: "Todas admiten PWM (ledcWrite). GPIO 25 y 26 tienen DAC. GPIO 5, 12 y 15 son pines de arranque: GPIO 12 en alto al arrancar fija la flash a 1.8 V y la placa no arranca. GPIO 4, 12–15 y 25–27 son del ADC2." },
    { id: "GPIO 21 / 22", nombre: "SDA / SCL", funcion: "Bus I²C por defecto." },
    { id: "GPIO 32, 33", nombre: "ADC1 (canales 4, 5)", funcion: "Entrada analógica o E/S digital." },
    { id: "GPIO 34, 35, 36 (VP), 39 (VN)", nombre: "Solo entrada", funcion: "ADC1; sin salida ni pull-up interno." },
    { id: "TX0 (1) / RX0 (3)", nombre: "UART0", funcion: "Serial por USB." },
    { id: "3V3", nombre: "Salida de 3.3 V", funcion: "Regulador de la placa." },
    { id: "VIN", nombre: "Entrada de 5 V", funcion: "Alimentación externa." },
    { id: "GND", nombre: "Tierra", funcion: "Referencia común." },
    { id: "EN", nombre: "Enable", funcion: "Reinicio (botón EN)." },
  ],
  simulador: {
    modelo: [
      "runSketch() compila con el FQBN esp32:esp32:esp32 y ejecuta en esp32sim el bootloader, la tabla de particiones y la aplicación.",
      "Las entradas se envían como un script de acciones; los cambios de GPIO se leen de un archivo VCD (0 o 3.3 V) y la consola UART0 se captura como Serial.",
      "Al igual que con el UNO, outputSources enlaza un pin con una fuente del circuito para el análisis transitorio.",
    ],
    editable: "Sketch, duración (máximo 10 s) y entradas digitales y analógicas por número de GPIO.",
    lecturas: [
      { clave: "pins", significado: "Eventos de salida de cada GPIO." },
      { clave: "serial", significado: "Salida de la consola UART0." },
      { clave: "circuitSamples", significado: "Respuesta del circuito enlazado." },
    ],
    limitaciones: [
      "Todavía no se puede arrastrar al playground: se usa desde runSketch().",
      "Necesita esp32sim con sus archivos ROM (ESP32SIM_PATH, ESP32SIM_ROM_DIR) y el core esp32:esp32 de Arduino CLI.",
      "Wi-Fi, Bluetooth y bibliotecas adicionales no están disponibles. Una entrada analógica fuera de 0–3.3 V o en un GPIO sin ADC se rechaza.",
    ],
  },
  pruebas: [
    {
      titulo: "Blink en el LED integrado (GPIO 2)",
      montaje: "Solo la placa.",
      pasos: ["Ejecuta el sketch durante 2 s.", "Revisa los eventos del pin 2."],
      esperado: "GPIO 2 alterna entre 3.3 V y 0 V cada 0.5 s.",
      codigo: `await runSketch({
  board: "esp32-devkit-v1",
  durationSeconds: 2,
  sketch: \`void setup() { pinMode(2, OUTPUT); }
void loop() { digitalWrite(2, HIGH); delay(500); digitalWrite(2, LOW); delay(500); }\`,
});`,
    },
    {
      titulo: "ADC de 12 bits",
      montaje: "1.65 V inyectados en GPIO 34.",
      pasos: ["Ejecuta el sketch con inputs.analog = { 34: 1.65 } e imprime analogRead(34)."],
      esperado: "Valores cercanos a 2048. El ADC real del ESP32 no es lineal en los extremos, así que en hardware conviene calibrarlo.",
    },
    {
      titulo: "Validación de rangos",
      montaje: "Entrada analógica de 5 V en GPIO 34, o en un GPIO sin ADC (p. ej. 4).",
      pasos: ["Ejecuta runSketch."],
      esperado: "La ejecución falla con «must be between 0 and 3.3 V» o «is not enabled for analog input»: recuerda que 5 V dañaría la placa real.",
    },
  ],
  fallos: [
    { fallo: "Conectar señales de 5 V (p. ej. ECHO del HC-SR04)", efecto: "Daña el GPIO; usa un divisor o un convertidor de nivel." },
    { fallo: "Usar GPIO 34–39 como salida", efecto: "No funciona: son solo de entrada." },
    { fallo: "Pines de arranque (0, 2, 5, 12, 15) con cargas conectadas", efecto: "La placa no arranca o no se deja programar." },
    { fallo: "ADC2 con Wi-Fi activo", efecto: "Lecturas que fallan." },
    { fallo: "Fuente USB débil", efecto: "Reinicios por caída de voltaje (brownout) al activar el Wi-Fi." },
  ],
  referencias: [{ texto: "Espressif — ESP32 datasheet", url: "https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf" }],
};

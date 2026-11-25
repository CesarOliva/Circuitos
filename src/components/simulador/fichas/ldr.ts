import type { Ficha } from "./tipos";

export const ficha: Ficha = {
  slug: "ldr",
  titulo: "Fotorresistencia (LDR)",
  grupo: "Sensores",
  clase: "LDR",
  archivo: "simulacion/src/components/sensors/LDR.ts",
  resumen: "Resistencia que disminuye cuando aumenta la luz.",
  descripcion: [
    "La LDR (light dependent resistor) es de sulfuro de cadmio: a mayor iluminación, menor resistencia. En oscuridad puede superar 1 MΩ y a plena luz bajar a cientos de Ω.",
    "Lo habitual es leerla con un divisor de voltaje (LDR + resistencia fija) conectado a una entrada analógica, para hacer luces nocturnas o detectores de sombra.",
  ],
  especificaciones: [
    { parametro: "Resistencia de referencia", simulador: "10 kΩ a 10 lx", real: "GL5528: 10–20 kΩ a 10 lx" },
    { parametro: "Gamma (pendiente)", simulador: "0.7", real: "GL5528: 0.6 (Senba); otros fabricantes dan 0.6–0.7" },
    { parametro: "Iluminación", simulador: "10 lx (editable)", real: "Interior: 100–500 lx; sol directo: > 10 000 lx" },
    { parametro: "Resistencia en oscuridad", simulador: "Calculada con un mínimo de 0.01 lx: ≈ 1.26 MΩ", real: "≥ 1 MΩ" },
    { parametro: "Voltaje / potencia máxima", simulador: "Playground: no se vigila; validador de la ficha: aviso por encima de 150 V o 100 mW", real: "GL5528: 150 V DC, 100 mW" },
  ],
  pines: [
    { id: "1", nombre: "Terminal 1", funcion: "Sin polaridad." },
    { id: "2", nombre: "Terminal 2", funcion: "Sin polaridad." },
  ],
  simulador: {
    modelo: ["Se modela como una resistencia R = 10 kΩ · (10 lx / iluminación)^0.7, calculada antes de resolver el circuito."],
    editable: "Iluminación en lux.",
    lecturas: [
      { clave: "illuminanceLux / resistanceOhms", significado: "Luz aplicada y resistencia resultante." },
      { clave: "voltage / current", significado: "Para leerla como divisor." },
    ],
    limitaciones: [
      "Respuesta instantánea: una LDR real tarda decenas de ms en reaccionar.",
      "No depende del color de la luz.",
      "El playground no avisa si se supera su potencia máxima (100 mW en el GL5528); el validador de la ficha sí.",
    ],
  },
  pruebas: [
    {
      titulo: "LED que responde a la luz",
      montaje: "Batería 9 V → LDR → resistencia 470 Ω → LED → −.",
      pasos: ["Simula con 10 lx.", "Cambia a 100 lx y luego a 1000 lx."],
      esperado: "10 lx: R = 10 kΩ e I ≈ 0.66 mA (apagado). 100 lx: R ≈ 2 kΩ e I ≈ 2.8 mA (enciende). 1000 lx: R ≈ 398 Ω e I ≈ 8 mA. La resistencia de 470 Ω deja a la LDR en ≈25 mW a 1000 lx; sin ella pasarían ≈17 mA y la LDR disiparía ≈0.12 W, más que sus 100 mW.",
    },
    {
      titulo: "Divisor de voltaje con LDR",
      montaje: "Batería 9 V → LDR → nodo X → resistencia 10 kΩ → −.",
      pasos: ["Simula con 10 lx y luego con 1000 lx, observando el voltaje de la resistencia."],
      esperado: "10 lx: 4.5 V en el nodo X. 1000 lx: ≈ 8.7 V. Más luz equivale a más voltaje.",
    },
  ],
  fallos: [
    { fallo: "Abierta", efecto: "Lectura fija como si estuviera a oscuras total." },
    { fallo: "Superficie sucia o envejecida", efecto: "Menor sensibilidad; los umbrales del programa dejan de funcionar." },
  ],
  referencias: [{ texto: "Senba GL5528 (LCSC C125627)", url: "https://www.lcsc.com/product-detail/C125627.html" }],
};

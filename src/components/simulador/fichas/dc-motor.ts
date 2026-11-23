import type { Ficha } from "./tipos";

export const ficha: Ficha = {
  slug: "dc-motor",
  titulo: "Motor DC",
  grupo: "Actuadores",
  clase: "DCMotor",
  archivo: "simulacion/src/components/actuators/DCMotor.ts",
  resumen: "Convierte energía eléctrica en giro; su velocidad sube con el voltaje.",
  descripcion: [
    "El motor de escobillas tipo 130 es el de los juguetes y los kits de robótica. Al invertir la polaridad cambia el sentido de giro.",
    "Arrancado o bloqueado consume mucho más que en vacío, por eso no se conecta directo a un pin de Arduino: se usa un transistor o un driver (L298N, TB6612) y un diodo de rueda libre.",
  ],
  especificaciones: [
    { parametro: "Voltaje nominal", simulador: "6 V (editable)", real: "Tipo 130: 3–6 V" },
    { parametro: "Corriente en vacío", simulador: "0.1 A en el playground; 70 mA en la galería", real: "~0.1–0.2 A" },
    { parametro: "Velocidad en vacío", simulador: "3000 rpm en el playground; 9000 en la galería", real: "Tipo 130 a 6 V: ~9000–12 000 rpm" },
    { parametro: "Corriente de bloqueo", simulador: "1.2 A", real: "0.5–2 A según el modelo" },
  ],
  pines: [
    { id: "+", nombre: "Terminal +", funcion: "Con + al positivo gira en un sentido." },
    { id: "-", nombre: "Terminal −", funcion: "Al invertir la conexión gira al revés." },
  ],
  simulador: {
    modelo: [
      "Eléctricamente es una resistencia R = Vnominal / Ivacío (60 Ω en el playground).",
      "rpm = rpm_vacío × min(1, |V| / Vnominal). Se marca como bloqueado (stalled) si la corriente alcanza la de bloqueo.",
      "El playground anima el giro cuando rpm > 0.",
    ],
    editable: "Voltaje nominal en V.",
    lecturas: [
      { clave: "rpm", significado: "Velocidad estimada." },
      { clave: "stalled", significado: "Si la corriente llegó a la de bloqueo." },
      { clave: "current / power", significado: "Consumo." },
    ],
    limitaciones: ["Sin carga mecánica, inercia ni fuerza contraelectromotriz.", "Ignora el sentido de giro: usa |V|."],
  },
  pruebas: [
    {
      titulo: "Motor a voltaje nominal",
      montaje: "Batería 6 V conectada al motor.",
      pasos: ["Ajusta la batería a 6 V y simula."],
      esperado: "I = 0.1 A, 3000 rpm y el motor anima su giro.",
    },
    {
      titulo: "Control de velocidad por voltaje",
      montaje: "El mismo circuito.",
      pasos: ["Simula con 3 V y luego con 9 V."],
      esperado: "3 V: 1500 rpm. 9 V: 3000 rpm (el modelo limita al valor de vacío) e I = 0.15 A.",
    },
    {
      titulo: "Motor controlado por transistor",
      montaje: "Batería 9 V → motor → colector; emisor → −; base → 10 kΩ → pulsador → +.",
      pasos: ["Simula con el pulsador suelto y luego presionado."],
      esperado: "Solo gira con el pulsador presionado.",
    },
  ],
  fallos: [
    { fallo: "Bobinado abierto o escobillas gastadas", efecto: "No gira o arranca de forma irregular." },
    { fallo: "Eje bloqueado", efecto: "Corriente de bloqueo sostenida y calentamiento rápido." },
    { fallo: "Sin diodo de rueda libre", efecto: "Picos de voltaje que dañan el transistor o reinician el microcontrolador." },
  ],
  referencias: [],
};

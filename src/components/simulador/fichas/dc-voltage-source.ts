import type { Ficha } from "./tipos";

export const ficha: Ficha = {
  slug: "dc-voltage-source",
  titulo: "Fuente de voltaje DC (batería)",
  grupo: "Fuentes",
  clase: "DCVoltageSource",
  archivo: "simulacion/src/components/sources/DCVoltageSource.ts",
  resumen: "Mantiene una diferencia de potencial constante entre sus terminales + y −.",
  descripcion: [
    "Es la fuente de energía de cualquier circuito del simulador. En el playground aparece como «Batería DC» y por defecto entrega 9 V, como una pila cuadrada.",
    "Una fuente real tiene resistencia interna y un límite de corriente; cuando la carga pide demasiado, su voltaje cae. La fuente del simulador es ideal: mantiene el voltaje sin importar la corriente.",
  ],
  especificaciones: [
    { parametro: "Voltaje de salida", simulador: "9 V (editable, cualquier valor finito, incluso negativo)", real: "Pila 9 V: ~9.6 V nueva, ~7 V descargada; pila AA: 1.5 V" },
    { parametro: "Corriente máxima", simulador: "Sin límite (Infinity)", real: "Pila 9 V alcalina: decenas de mA continuos; fuente de laboratorio: ajustable" },
    { parametro: "Resistencia interna", simulador: "0 Ω (fuente ideal)", real: "Pila 9 V alcalina: ~1–2 Ω; crece al descargarse" },
    { parametro: "Polaridad", simulador: "Terminal + y terminal −", real: "Marcada en la carcasa; invertirla daña componentes polarizados" },
  ],
  pines: [
    { id: "+", nombre: "Positivo", funcion: "Terminal de mayor potencial. La corriente sale por aquí hacia la carga." },
    { id: "-", nombre: "Negativo", funcion: "Terminal de referencia. El solver toma el negativo de la primera fuente como tierra (0 V)." },
  ],
  simulador: {
    modelo: [
      "Se modela como una restricción de voltaje ideal en el análisis nodal modificado (MNA): V(+) − V(−) = voltaje.",
      "Todo circuito necesita al menos una fuente; sin ella el solver responde «At least one DC source is required».",
      "La corriente que entrega se lee directamente de la incógnita de la fuente en el sistema MNA.",
    ],
    editable: "Voltaje en V (campo de valor del componente seleccionado).",
    lecturas: [
      { clave: "voltage / current / power", significado: "Voltaje entre terminales, corriente entregada y potencia." },
      { clave: "maxCurrentExceeded", significado: "Verdadero si la corriente supera maxCurrent. Con la fuente del playground (sin límite) nunca se activa." },
    ],
    limitaciones: [
      "No simula descarga, resistencia interna ni protección contra cortocircuito.",
      "Dos fuentes ideales en paralelo con voltajes distintos, o una fuente en corto, no tienen solución: el solver lo reporta como «Conflicting ideal voltage sources».",
    ],
  },
  pruebas: [
    {
      titulo: "Ley de Ohm básica",
      montaje: "Batería de 9 V con una resistencia de 1 kΩ entre + y −.",
      pasos: ["Coloca la batería y una resistencia.", "Cambia la resistencia a 1000 Ω.", "Conecta + a un extremo y − al otro.", "Pulsa Simular y selecciona la batería."],
      esperado: "I = 9 V / 1 kΩ = 9 mA; potencia entregada 81 mW.",
    },
    {
      titulo: "Detección de cortocircuito",
      montaje: "Un cable directo entre + y − de la batería.",
      pasos: ["Conecta + con − sin ningún componente.", "Pulsa Simular."],
      esperado: "El simulador muestra un error de fuentes ideales en conflicto, el equivalente a un cortocircuito.",
    },
    {
      titulo: "Circuito sin fuente",
      montaje: "Una resistencia y un LED conectados entre sí, sin batería.",
      pasos: ["Arma el lazo sin batería.", "Pulsa Simular."],
      esperado: "Error «At least one DC source is required».",
    },
  ],
  fallos: [
    { fallo: "Pila descargada", efecto: "El voltaje cae bajo carga: LEDs tenues, motores lentos, microcontroladores que se reinician." },
    { fallo: "Cortocircuito externo", efecto: "Corriente muy alta, calentamiento de la pila o los cables; puede fundir pistas o dañar la fuente." },
    { fallo: "Polaridad invertida", efecto: "Daña capacitores electrolíticos, LEDs en inversa excesiva y circuitos integrados." },
    { fallo: "Regulación defectuosa (fuente de laboratorio)", efecto: "Voltaje inestable: lecturas erráticas y reinicios." },
  ],
  referencias: [],
};

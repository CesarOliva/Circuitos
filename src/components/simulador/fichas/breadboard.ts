import type { Ficha } from "./tipos";

export const ficha: Ficha = {
  slug: "breadboard",
  titulo: "Protoboard",
  grupo: "Montaje",
  clase: "Breadboard",
  archivo: "simulacion/src/components/passive/Breadboard.ts",
  resumen: "Placa de pruebas sin soldadura: los agujeros de cada tira están unidos por dentro.",
  descripcion: [
    "Permite armar y modificar circuitos insertando patas y cables. Cada columna numerada tiene dos tiras de cinco agujeros (a–e y f–j) separadas por el canal central, y los rieles laterales recorren la placa de punta a punta.",
    "El canal central está pensado para los circuitos integrados DIP: cada pata queda en una tira distinta.",
  ],
  especificaciones: [
    { parametro: "Columnas numeradas", simulador: "30", real: "Media placa (400 puntos): 30; completa (830 puntos): 63" },
    { parametro: "Tiras por columna", simulador: "2 (a–e, f–j)", real: "2" },
    { parametro: "Rieles de alimentación", simulador: "4 (top+, top−, bottom+, bottom−), continuos", real: "4; en algunas placas largas el riel está cortado a la mitad" },
    { parametro: "Puntos de conexión", simulador: "420 (300 de tiras + 120 de rieles)", real: "400 o 830 típicos" },
    { parametro: "Límite eléctrico", simulador: "No se modela", real: "Solo baja tensión; el límite de corriente lo fija cada fabricante (orientativo: ~1 A). Nunca tensión de red" },
  ],
  pines: [
    { id: "a1 … e30", nombre: "Tira superior de cada columna", funcion: "Los cinco agujeros a–e de una misma columna están unidos." },
    { id: "f1 … j30", nombre: "Tira inferior de cada columna", funcion: "f–j de una misma columna están unidos, pero no con a–e." },
    { id: "top+1 … top+30", nombre: "Riel superior +", funcion: "Todo el riel es un solo nodo." },
    { id: "top-1 … top-30", nombre: "Riel superior −", funcion: "Todo el riel es un solo nodo." },
    { id: "bottom+ / bottom-", nombre: "Rieles inferiores", funcion: "Igual que los superiores; no están unidos con ellos." },
  ],
  simulador: {
    modelo: [
      "No es un componente del solver. El playground une con union-find todos los terminales que caen en la misma tira (getConnectedTerminalGroups) y genera una conexión por nodo.",
      "Por eso no tiene voltaje ni corriente propios: solo define qué terminales quedan conectados.",
    ],
    editable: "Posición en el área de trabajo; los componentes se conectan a sus agujeros.",
    lecturas: [{ clave: "rows / connectedGroups / powerRails", significado: "30 columnas, 60 tiras y 4 rieles." }],
    limitaciones: ["Contactos perfectos: no hay falsos contactos ni resistencia de contacto."],
  },
  pruebas: [
    {
      titulo: "Continuidad de una tira",
      montaje: "Batería con + en a5; resistencia de 470 Ω de e5 a e10; LED de a10 a a15; a15 al −.",
      pasos: ["Coloca la protoboard y conecta las piezas a esos agujeros.", "Simula."],
      esperado: "El LED enciende: a5 y e5 son la misma tira.",
    },
    {
      titulo: "El canal central aísla",
      montaje: "El mismo circuito, pero con la resistencia de f5 a f10.",
      pasos: ["Mueve la resistencia a la mitad inferior y simula."],
      esperado: "El circuito queda abierto (e5 y f5 no están unidos): el LED no enciende, o el solver reporta nodos flotantes.",
    },
    {
      titulo: "Riel de alimentación",
      montaje: "+ de la batería en top+1 y un componente tomando energía de top+30.",
      pasos: ["Simula."],
      esperado: "Conduce: el riel es continuo de 1 a 30.",
    },
  ],
  fallos: [
    { fallo: "Contacto flojo o deformado", efecto: "Conexión intermitente; el circuito funciona al mover los cables." },
    { fallo: "Componente en la columna equivocada", efecto: "Circuito abierto o cortocircuito accidental." },
    { fallo: "Riel cortado a la mitad (placas largas)", efecto: "La mitad del circuito queda sin alimentación." },
    { fallo: "Corriente excesiva", efecto: "Contactos calientes que pierden presión." },
  ],
  referencias: [],
};

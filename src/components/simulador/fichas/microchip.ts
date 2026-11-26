import type { Ficha } from "./tipos";

export const ficha: Ficha = {
  slug: "microchip",
  titulo: "Microchip genérico",
  grupo: "Semiconductores",
  clase: "Microchip",
  archivo: "simulacion/src/components/semiconductors/Microchip.ts",
  resumen: "Encapsulado genérico de 16 pines (DIP-16) para montar y cablear, sin lógica interna.",
  descripcion: [
    "Es el encapsulado de un circuito integrado de 16 pines: un bloque negro con una marca en el pin 1, que se coloca sobre la protoboard atravesando el canal central.",
    "Sirve para practicar la conexión de pines. Cada pin es un terminal independiente: el simulador no sabe qué hace el chip por dentro, solo qué conexiones le pones.",
  ],
  especificaciones: [
    { parametro: "Encapsulado", simulador: "DIP-16 (16 pines, 2 filas de 8)", real: "DIP-16 de 0.1 pulgadas de paso, filas separadas 0.3 pulgadas" },
    { parametro: "Numeración", simulador: "Pines 1 a 8 en la fila superior, de izquierda a derecha; 9 a 16 en la inferior, de derecha a izquierda", real: "Contra el sentido de las manecillas desde la marca del pin 1" },
    { parametro: "Lógica", simulador: "No modelada", real: "Depende del circuito integrado concreto (555, operacional, compuerta…)" },
  ],
  pines: [
    { id: "1", nombre: "Pin 1", funcion: "Fila superior, junto a la marca." },
    { id: "2", nombre: "Pin 2", funcion: "Fila superior." },
    { id: "3", nombre: "Pin 3", funcion: "Fila superior." },
    { id: "4", nombre: "Pin 4", funcion: "Fila superior." },
    { id: "5", nombre: "Pin 5", funcion: "Fila superior." },
    { id: "6", nombre: "Pin 6", funcion: "Fila superior." },
    { id: "7", nombre: "Pin 7", funcion: "Fila superior." },
    { id: "8", nombre: "Pin 8", funcion: "Fila superior, el más alejado de la marca." },
    { id: "9", nombre: "Pin 9", funcion: "Fila inferior, el más alejado de la marca." },
    { id: "10", nombre: "Pin 10", funcion: "Fila inferior." },
    { id: "11", nombre: "Pin 11", funcion: "Fila inferior." },
    { id: "12", nombre: "Pin 12", funcion: "Fila inferior." },
    { id: "13", nombre: "Pin 13", funcion: "Fila inferior." },
    { id: "14", nombre: "Pin 14", funcion: "Fila inferior." },
    { id: "15", nombre: "Pin 15", funcion: "Fila inferior." },
    { id: "16", nombre: "Pin 16", funcion: "Fila inferior, junto a la marca." },
  ],
  simulador: {
    modelo: ["No tiene modelo eléctrico: el solver lo ignora. Sus pines no están unidos entre sí; solo cuentan los cables y componentes que conectas a cada pin."],
    editable: "Nada: sus dieciséis pines se conectan en el playground.",
    lecturas: [{ clave: "package / pins", significado: "Encapsulado y número de pines." }],
    limitaciones: [
      "El chip no tiene alimentación ni lógica: no cambia su salida según sus entradas.",
      "Para simular un circuito real con un chip hay que modelar su interior, que aquí no existe.",
    ],
  },
  pruebas: [
    {
      titulo: "El chip no cierra el camino",
      montaje: "Batería 9 V (+) → resistencia 470 Ω → pin 1 del chip. El pin 8 y el negativo de la batería quedan libres.",
      pasos: ["Simula.", "Conecta el pin 8 al negativo de la batería y vuelve a simular."],
      esperado: "Con el pin 8 libre no hay corriente: el chip no une sus pines por dentro, así que el camino queda abierto. Al conectar el pin 8 al negativo, el camino se cierra por los cables y la corriente circula.",
    },
  ],
  fallos: [
    { fallo: "Pin doblado o sin contacto", efecto: "Ese pin no llega al circuito; el resto del montaje sigue igual." },
    { fallo: "Pines en cortocircuito", efecto: "Un puente de soldadura une dos pines: en el montaje se comportan como un solo nodo." },
  ],
  referencias: [{ texto: "Hoja de datos del 555 (DIP-8), como referencia de encapsulado", url: "https://www.ti.com/lit/ds/symlink/ne555.pdf" }],
};

import type { Ficha } from "./tipos";

export const ficha: Ficha = {
  slug: "inductor",
  titulo: "Inductor (bobina)",
  grupo: "Pasivos",
  clase: "Inductor",
  archivo: "simulacion/src/components/passive/Inductor.ts",
  resumen: "Almacena energía en un campo magnético y se opone a los cambios de corriente.",
  descripcion: [
    "Un inductor es un alambre enrollado, a veces sobre un núcleo de ferrita. Su voltaje depende de cómo cambia la corriente: v = L · di/dt.",
    "Con corriente continua estable no hay cambio, así que solo queda la resistencia del alambre. Se usa en filtros, fuentes conmutadas y para suprimir ruido.",
  ],
  especificaciones: [
    { parametro: "Inductancia", simulador: "100 mH en el playground (editable en mH); 10 mH en la galería", real: "Inductores axiales: µH a decenas de mH" },
    { parametro: "Resistencia serie (DCR)", simulador: "0 Ω en el playground; 2 Ω en la galería", real: "De mΩ (µH de potencia) a cientos de Ω: Bourns RL622-104K (100 mH): ≤ 235 Ω" },
    { parametro: "Corriente máxima", simulador: "1 A en el playground, sea cual sea la inductancia; sin especificar en la galería", real: "Limitada por saturación del núcleo y calentamiento del alambre. Bourns RL622-104K (100 mH): 20 mA; del orden de 1 A solo en inductores de µH" },
  ],
  pines: [
    { id: "1", nombre: "Terminal 1", funcion: "Sin polaridad." },
    { id: "2", nombre: "Terminal 2", funcion: "Sin polaridad." },
  ],
  simulador: {
    modelo: [
      "En el análisis DC del playground (DCR = 0) el inductor es un cortocircuito ideal: sus dos nodos quedan a 0 V de diferencia.",
      "Si tiene DCR > 0, se modela como una resistencia de ese valor.",
      "El TransientSolver sí integra v = L · di/dt cuando se simula en el tiempo.",
    ],
    editable: "Inductancia en mH.",
    lecturas: [
      { clave: "current", significado: "Corriente que lo atraviesa." },
      { clave: "maxCurrentExceeded", significado: "Verdadero si la corriente supera 1 A." },
    ],
    limitaciones: [
      "En el playground no se ven transitorios (picos de voltaje al abrir el circuito).",
      "No modela saturación del núcleo.",
      "El límite de 1 A es el mismo para cualquier inductancia: con el valor por defecto (100 mH) un inductor real se dañaría con unas decenas de mA, mucho antes de que se active maxCurrentExceeded.",
      "Error conocido: el DCSolver rechaza un inductor ideal (DCR = 0) con «Unsupported component», y el playground los crea así, por lo que un circuito con inductor no se puede simular allí. El validador de esta ficha usa una DCR de 1 mΩ.",
    ],
  },
  pruebas: [
    {
      titulo: "El inductor en DC es un cable",
      montaje: "Batería 9 V → resistencia 470 Ω → inductor → batería.",
      pasos: ["Arma el circuito en serie.", "Simúlalo con el validador de esta ficha (DCR de 1 mΩ): el playground todavía rechaza el inductor ideal (ver limitaciones)."],
      esperado: "Voltaje en el inductor ≈ 0 V (unos 19 µV con 1 mΩ); corriente ≈ 19.1 mA, igual que sin inductor.",
    },
    {
      titulo: "Exceso de corriente",
      montaje: "Batería 9 V → resistencia de 5 Ω → inductor.",
      pasos: ["Cambia la resistencia a 5 Ω.", "Simula, con la misma salvedad de la prueba anterior."],
      esperado: "I ≈ 1.8 A: maxCurrentExceeded = sí. La resistencia de 5 Ω disipa ≈ 16 W, así que también marca ratedPowerExceeded (su límite es 0.25 W).",
    },
  ],
  fallos: [
    { fallo: "Bobinado abierto", efecto: "Interrumpe el circuito." },
    { fallo: "Espiras en corto", efecto: "Baja la inductancia y aumenta el calentamiento." },
    { fallo: "Saturación del núcleo", efecto: "La inductancia efectiva cae y la corriente crece bruscamente." },
  ],
  referencias: [{ texto: "Bourns RL622-104K-RC — inductor radial 100 mH, 20 mA, 235 Ω", url: "https://www.digikey.com/en/products/detail/bourns-inc/RL622-104K-RC/946913" }],
};

import type { Ficha } from "./tipos";

export const ficha: Ficha = {
  slug: "diode",
  titulo: "Diodo rectificador",
  grupo: "Semiconductores",
  clase: "Diode",
  archivo: "simulacion/src/components/semiconductors/Diode.ts",
  resumen: "Deja pasar la corriente de ánodo a cátodo y la bloquea en sentido contrario.",
  descripcion: [
    "Es una unión PN de silicio. En polarización directa conduce cuando el voltaje supera unos 0.7 V; en inversa bloquea hasta su voltaje de ruptura.",
    "Se usa para rectificar AC, proteger contra polaridad invertida y como diodo de rueda libre en motores y relés. La franja gris marca el cátodo.",
  ],
  especificaciones: [
    { parametro: "Caída directa (VF)", simulador: "0.7 V (editable)", real: "1N4001: ≤ 1.1 V a 1 A" },
    { parametro: "Corriente directa máxima", simulador: "1 A", real: "1N4001: IF(AV) = 1 A; pico no repetitivo 30 A" },
    { parametro: "Voltaje inverso máximo", simulador: "50 V", real: "1N4001: VRRM = 50 V (1N4007: 1000 V)" },
  ],
  pines: [
    { id: "A", nombre: "Ánodo", funcion: "Entrada de la corriente en polarización directa." },
    { id: "K", nombre: "Cátodo", funcion: "Salida de la corriente; lado de la franja." },
  ],
  simulador: {
    modelo: [
      "Es un modelo por tramos: si V(A) − V(K) ≥ VF, se comporta como una fuente de VF en serie con 1 mΩ; si no, como circuito abierto (10⁻¹² S).",
      "El solver itera (hasta 30 veces) hasta que el estado de todos los diodos deja de cambiar.",
    ],
    editable: "Caída directa en V.",
    lecturas: [
      { clave: "current", significado: "(V − VF) / 1 mΩ si conduce; 0 si no." },
      { clave: "maxForwardCurrentExceeded", significado: "Corriente directa mayor que 1 A." },
      { clave: "maxReverseVoltageExceeded", significado: "Voltaje inverso mayor que 50 V." },
    ],
    limitaciones: ["Sin curva exponencial ni corriente de fuga.", "Si conectas el diodo directo a la fuente, la corriente calculada es enorme: falta una resistencia que la limite."],
  },
  pruebas: [
    {
      titulo: "Polarización directa",
      montaje: "Batería 9 V → 1 kΩ → ánodo; cátodo → −.",
      pasos: ["Arma el circuito y simula."],
      esperado: "I = (9 − 0.7) / 1 kΩ ≈ 8.3 mA; el diodo cae 0.7 V.",
    },
    {
      titulo: "Polarización inversa",
      montaje: "El mismo circuito con el diodo girado (cátodo hacia la resistencia).",
      pasos: ["Invierte el diodo y simula."],
      esperado: "Corriente 0; todo el voltaje (9 V) queda en el diodo.",
    },
    {
      titulo: "Voltaje inverso excesivo",
      montaje: "Diodo en inversa con la batería a 60 V.",
      pasos: ["Sube la batería a 60 V y simula."],
      esperado: "maxReverseVoltageExceeded = sí.",
    },
  ],
  fallos: [
    { fallo: "Abierto", efecto: "No conduce en ningún sentido." },
    { fallo: "En corto", efecto: "Conduce en ambos sentidos; puede causar sobrecorriente." },
    { fallo: "Ruptura inversa", efecto: "Al superar VRRM aumenta la fuga y el diodo queda en corto o abierto." },
  ],
  referencias: [{ texto: "Vishay 1N4001–1N4007", url: "https://www.vishay.com/docs/88503/1n4001.pdf" }],
};

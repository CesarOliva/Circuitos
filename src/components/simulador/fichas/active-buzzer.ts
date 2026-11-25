import type { Ficha } from "./tipos";

export const ficha: Ficha = {
  slug: "active-buzzer",
  titulo: "Zumbador activo",
  grupo: "Actuadores",
  clase: "ActiveBuzzer",
  archivo: "simulacion/src/components/actuators/ActiveBuzzer.ts",
  resumen: "Emite un tono fijo al recibir voltaje continuo.",
  descripcion: [
    "El zumbador activo lleva un oscilador interno: basta alimentarlo para que suene, a diferencia del pasivo, que necesita una señal (tone() en Arduino).",
    "Tiene polaridad; la pata larga o la marca + va al positivo. Se usa en alarmas, avisos y temporizadores.",
  ],
  especificaciones: [
    { parametro: "Voltaje nominal", simulador: "5 V (editable)", real: "TMB12A05: 5 V nominal, opera de 4 a 8 V" },
    { parametro: "Corriente nominal", simulador: "30 mA", real: "≤ 30 mA" },
    { parametro: "Frecuencia", simulador: "—", real: "2.3–2.7 kHz según el fabricante" },
    { parametro: "Nivel sonoro", simulador: "—", real: "~85 dB a 10 cm" },
  ],
  pines: [
    { id: "+", nombre: "Positivo", funcion: "Pata larga; al positivo o a un pin de salida." },
    { id: "-", nombre: "Negativo", funcion: "A tierra." },
  ],
  simulador: {
    modelo: [
      "Es una resistencia R = Vnominal / Inominal (≈167 Ω con 5 V y 30 mA).",
      "Está activo si |V| ≥ Vnominal. El playground lo anima mientras está activo.",
    ],
    editable: "Voltaje nominal en V.",
    lecturas: [
      { clave: "active", significado: "Si está sonando." },
      { clave: "current", significado: "Consumo." },
    ],
    limitaciones: [
      "Umbral estricto: un zumbador real suena, más débil, por debajo de su voltaje nominal.",
      "Ignora la polaridad: usa |V|, así que conectado al revés también aparece activo, aunque uno real no sonaría.",
      "No genera audio.",
    ],
  },
  pruebas: [
    {
      titulo: "Zumbador a 5 V",
      montaje: "Batería 5 V conectada al zumbador.",
      pasos: ["Ajusta la batería a 5 V y simula."],
      esperado: "active = sí e I = 30 mA.",
    },
    {
      titulo: "Voltaje insuficiente",
      montaje: "El mismo circuito.",
      pasos: ["Baja la batería a 3 V y simula."],
      esperado: "active = no.",
    },
    {
      titulo: "Resistencia en serie",
      montaje: "Batería 9 V → 470 Ω → zumbador.",
      pasos: ["Simula."],
      esperado: "Al zumbador solo llegan ≈2.4 V: active = no. La resistencia «se come» el voltaje.",
    },
  ],
  fallos: [
    { fallo: "Polaridad invertida", efecto: "No suena." },
    { fallo: "Oscilador dañado", efecto: "Sonido débil, distorsionado o ausente." },
    { fallo: "Conectado a un pin sin transistor", efecto: "Consume ~30 mA: supera los 20 mA recomendados por pin del Arduino y se acerca al máximo absoluto de 40 mA. Mejor manejarlo con un transistor." },
  ],
  referencias: [{ texto: "Jiangsu Huaneng TMB12A05 (LCSC C96093)", url: "https://www.lcsc.com/product-detail/C96093.html" }],
};

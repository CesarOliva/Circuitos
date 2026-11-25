import type { Ficha } from "./tipos";

export const ficha: Ficha = {
  slug: "capacitor",
  titulo: "Capacitor",
  grupo: "Pasivos",
  clase: "Capacitor",
  archivo: "simulacion/src/components/passive/Capacitor.ts",
  resumen: "Almacena carga eléctrica; bloquea la corriente continua una vez cargado.",
  descripcion: [
    "Un capacitor son dos placas conductoras separadas por un aislante. Al aplicarle voltaje acumula carga (Q = C · V), y la corriente solo fluye mientras su voltaje cambia: i = C · dV/dt.",
    "Los electrolíticos (como el de 100 µF de la galería) tienen polaridad y una franja que marca el negativo. Los cerámicos no tienen polaridad.",
  ],
  especificaciones: [
    { parametro: "Capacitancia", simulador: "100 µF (editable en µF)", real: "Electrolíticos: 1 µF–10 000 µF; cerámicos: pF–µF" },
    { parametro: "Voltaje nominal", simulador: "25 V", real: "Electrolítico 100 µF / 25 V; conviene trabajar por debajo del 80 %" },
    { parametro: "Polaridad", simulador: "Playground: sin polaridad (terminales 1/2); galería: polarizado (+/−)", real: "Electrolítico: polarizado; cerámico: no" },
    { parametro: "ESR (resistencia serie equivalente)", simulador: "0 Ω", real: "Electrolítico 100 µF: décimas de Ω a algunos Ω; crece con la edad" },
    { parametro: "Tolerancia", simulador: "—", real: "±20 % típico en electrolíticos" },
    { parametro: "Voltaje inverso", simulador: "No se detecta en el playground", real: "Electrolítico: no admite inversa más allá de ~1 V" },
  ],
  pines: [
    { id: "+", nombre: "Positivo", funcion: "Al potencial más alto. En el playground (sin polaridad) este terminal se llama 1." },
    { id: "-", nombre: "Negativo", funcion: "Marcado con una franja en la carcasa. En el playground se llama 2." },
  ],
  simulador: {
    modelo: [
      "El playground usa análisis DC en estado estacionario: el capacitor ya está cargado y se comporta como circuito abierto (corriente 0).",
      "El TransientSolver (usado con microcontroladores) sí lo integra en el tiempo, de modo que se ve su carga y descarga.",
    ],
    editable: "Capacitancia en µF.",
    lecturas: [
      { clave: "voltage", significado: "Voltaje al que queda cargado." },
      { clave: "current", significado: "Siempre 0 en DC." },
      { clave: "ratedVoltageExceeded", significado: "Verdadero si |V| supera los 25 V nominales." },
    ],
    limitaciones: ["En el playground no se ve la curva de carga RC; solo el estado final.", "No detecta polaridad invertida en el modo sin polaridad del playground. Un electrolítico real conectado al revés se daña, así que revisa la franja aunque el simulador no avise."],
  },
  pruebas: [
    {
      titulo: "Bloqueo de corriente continua",
      montaje: "Batería 9 V → resistencia 1 kΩ → capacitor → batería.",
      pasos: ["Arma el lazo en serie.", "Simula y selecciona el capacitor y la resistencia."],
      esperado: "Corriente 0 mA; el capacitor queda con 9 V y la resistencia con 0 V.",
    },
    {
      titulo: "Sobrevoltaje",
      montaje: "El mismo circuito con la batería a 30 V.",
      pasos: ["Cambia la batería a 30 V.", "Simula."],
      esperado: "ratedVoltageExceeded = sí (30 V > 25 V).",
    },
    {
      titulo: "Capacitor en paralelo con un LED",
      montaje: "Batería 9 V → 470 Ω → LED, con el capacitor en paralelo al LED.",
      pasos: ["Conecta el capacitor entre ánodo y cátodo del LED.", "Simula."],
      esperado: "El LED enciende igual que sin el capacitor (≈14.7 mA): en DC el capacitor no conduce.",
    },
  ],
  fallos: [
    { fallo: "Capacitor seco o con capacitancia reducida", efecto: "Más rizado en fuentes y temporizadores que se desajustan." },
    { fallo: "Fuga o corto", efecto: "Consume corriente, se calienta y puede bajar el voltaje de la fuente." },
    { fallo: "ESR elevada", efecto: "Mayor rizado y calentamiento; típico de electrolíticos viejos." },
    { fallo: "Polaridad invertida o sobrevoltaje", efecto: "Se hincha, se ventila o explota." },
  ],
  referencias: [{ texto: "KEMET EDK — electrolítico 100 µF, 25 V", url: "https://search.kemet.com/component-documentation/download/specsheet/EDK107M025A9HAA" }],
};

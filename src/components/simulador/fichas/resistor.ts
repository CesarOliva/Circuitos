import type { Ficha } from "./tipos";

export const ficha: Ficha = {
  slug: "resistor",
  titulo: "Resistencia",
  grupo: "Pasivos",
  clase: "Resistor",
  archivo: "simulacion/src/components/passive/Resistor.ts",
  resumen: "Se opone al paso de la corriente: limita corrientes y reparte voltajes.",
  descripcion: [
    "La resistencia es el componente más usado en electrónica. Cumple la ley de Ohm, V = I · R, y convierte en calor la energía que disipa (P = V · I).",
    "Las de película de carbón de 1/4 W tienen su valor impreso en bandas de color. El simulador dibuja esas bandas a partir del valor configurado.",
  ],
  especificaciones: [
    { parametro: "Resistencia", simulador: "470 Ω en el playground (editable); 1 kΩ en la galería", real: "Serie E12/E24: de 1 Ω a 10 MΩ" },
    { parametro: "Tolerancia", simulador: "5 % (solo informativo)", real: "5 % (banda dorada) o 1 % (película metálica)" },
    { parametro: "Potencia nominal", simulador: "0.25 W", real: "1/4 W típica para montaje en protoboard" },
    { parametro: "Voltaje límite por potencia", simulador: "√(P·R): ≈10.8 V con 470 Ω; ≈15.8 V con 1 kΩ", real: "Además hay un voltaje máximo de trabajo (p. ej. 250 V) según el fabricante" },
  ],
  pines: [
    { id: "1", nombre: "Terminal 1", funcion: "Sin polaridad: se puede conectar en cualquier sentido." },
    { id: "2", nombre: "Terminal 2", funcion: "Sin polaridad." },
  ],
  simulador: {
    modelo: [
      "Se modela como una rama de conductancia G = 1/R entre sus dos nodos.",
      "La resistencia debe ser positiva; un valor de 0 o negativo genera error.",
    ],
    editable: "Resistencia en Ω.",
    lecturas: [
      { clave: "voltage / current / power", significado: "Caída de voltaje, corriente que la atraviesa y potencia disipada." },
      { clave: "ratedPowerExceeded", significado: "Verdadero si |V·I| supera 0.25 W: en la vida real se calentaría y podría quemarse." },
    ],
    limitaciones: ["No cambia su valor con la temperatura ni se «quema»: solo avisa con ratedPowerExceeded.", "La tolerancia no se aplica al cálculo."],
  },
  pruebas: [
    {
      titulo: "Corriente con la ley de Ohm",
      montaje: "Batería 9 V → resistencia 470 Ω → batería.",
      pasos: ["Conecta la resistencia directamente a la batería.", "Simula y selecciona la resistencia."],
      esperado: "I ≈ 19.1 mA, P ≈ 0.17 W y ratedPowerExceeded = no.",
    },
    {
      titulo: "Sobrecarga de potencia",
      montaje: "El mismo circuito con la resistencia en 100 Ω.",
      pasos: ["Cambia el valor a 100 Ω.", "Simula de nuevo."],
      esperado: "I = 90 mA y P = 0.81 W: ratedPowerExceeded = sí.",
    },
    {
      titulo: "Divisor de voltaje",
      montaje: "Batería 9 V con dos resistencias de 470 Ω en serie.",
      pasos: ["Une las dos resistencias en serie entre + y −.", "Simula y revisa el voltaje de cada una."],
      esperado: "Cada resistencia cae 4.5 V; la corriente es 9.6 mA.",
    },
  ],
  fallos: [
    { fallo: "Sobrecarga térmica", efecto: "Se oscurece o se quema; su valor deriva y suele terminar abierta." },
    { fallo: "Abierta", efecto: "Interrumpe la rama: no circula corriente." },
    { fallo: "Valor equivocado (bandas mal leídas)", efecto: "Corrientes muy altas o muy bajas; un LED puede quemarse o no encender." },
  ],
  referencias: [],
};

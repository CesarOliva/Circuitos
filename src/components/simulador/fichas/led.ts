import type { Ficha } from "./tipos";

export const ficha: Ficha = {
  slug: "led",
  titulo: "LED",
  grupo: "Semiconductores",
  clase: "LED",
  archivo: "simulacion/src/components/semiconductors/LED.ts",
  resumen: "Diodo que emite luz cuando circula corriente de ánodo a cátodo.",
  descripcion: [
    "Un LED es un diodo que convierte parte de la energía en luz. Su caída directa depende del color: unos 2 V el rojo y unos 3 V el azul o el blanco.",
    "Siempre necesita una resistencia en serie que limite la corriente: R = (Vfuente − VF) / I. La pata larga es el ánodo y el lado plano de la cápsula marca el cátodo.",
  ],
  especificaciones: [
    { parametro: "Color", simulador: "Rojo (la clase admite red, green, blue, yellow, white)", real: "Rojo 5 mm" },
    { parametro: "Caída directa (VF)", simulador: "2.1 V en el playground (editable); 2 V en la galería", real: "Rojo: 1.8–2.2 V a 20 mA" },
    { parametro: "Corriente directa máxima", simulador: "20 mA", real: "20 mA continuos (5–10 mA ya dan buen brillo)" },
    { parametro: "Umbral de «encendido»", simulador: "> 2 mA (lo usa el playground para iluminarlo)", real: "Visible desde ~1 mA" },
    { parametro: "Voltaje inverso máximo", simulador: "—", real: "≈ 5 V" },
  ],
  pines: [
    { id: "A", nombre: "Ánodo", funcion: "Pata larga; va hacia el positivo a través de la resistencia." },
    { id: "K", nombre: "Cátodo", funcion: "Pata corta, lado plano; va hacia el negativo." },
  ],
  simulador: {
    modelo: [
      "Usa el mismo modelo por tramos que el diodo: conduce si V(A) − V(K) ≥ VF (fuente VF + 1 mΩ); si no, circuito abierto.",
      "El playground ilumina el LED (2D y 3D) cuando su corriente supera 2 mA.",
    ],
    editable: "Caída directa VF en V.",
    lecturas: [
      { clave: "current", significado: "Corriente por el LED." },
      { clave: "maxForwardCurrentExceeded", significado: "Corriente mayor que 20 mA: un LED real se dañaría." },
    ],
    limitaciones: ["El brillo no es proporcional a la corriente: solo hay encendido o apagado.", "No detecta voltaje inverso excesivo."],
  },
  pruebas: [
    {
      titulo: "LED con resistencia limitadora",
      montaje: "Batería 9 V → 470 Ω → ánodo; cátodo → −.",
      pasos: ["Arma el circuito y simula."],
      esperado: "I = (9 − 2.1) / 470 ≈ 14.7 mA. LED encendido y maxForwardCurrentExceeded = no.",
    },
    {
      titulo: "Sin resistencia",
      montaje: "LED conectado directo a la batería de 9 V.",
      pasos: ["Quita la resistencia y simula."],
      esperado: "Corriente desmedida y maxForwardCurrentExceeded = sí. En la vida real el LED se quemaría.",
    },
    {
      titulo: "LED invertido",
      montaje: "El primer circuito con el LED girado.",
      pasos: ["Invierte el LED y simula."],
      esperado: "0 mA: el LED no enciende.",
    },
  ],
  fallos: [
    { fallo: "Quemado por exceso de corriente", efecto: "Queda abierto (no enciende) o con brillo muy reducido." },
    { fallo: "Polaridad invertida", efecto: "No enciende; con más de ~5 V en inversa puede romperse." },
    { fallo: "Degradación por calor", efecto: "Pierde brillo con el tiempo." },
  ],
  referencias: [{ texto: "LITEON — LED rojo", url: "https://optoelectronics.liteon.com/upload/download/DS22-2016-0382/LTST-010VEKT.PDF" }],
};

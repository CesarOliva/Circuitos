import type { Ficha } from "./tipos";

export const ficha: Ficha = {
  slug: "push-button",
  titulo: "Pulsador",
  grupo: "Controles",
  clase: "PushButton",
  archivo: "simulacion/src/components/controls/PushButton.ts",
  resumen: "Interruptor momentáneo: conduce solo mientras se mantiene presionado.",
  descripcion: [
    "El pulsador táctil de 6×6 mm es la entrada más común en proyectos con Arduino. Un resorte lo devuelve a su posición al soltarlo.",
    "Puede ser normalmente abierto (NO: conduce al presionar) o normalmente cerrado (NC: deja de conducir al presionar). El del playground es NO.",
  ],
  especificaciones: [
    { parametro: "Tipo de contacto", simulador: "NO (normalmente abierto)", real: "NO en pulsadores táctiles" },
    { parametro: "Resistencia de contacto", simulador: "0 Ω (ideal)", real: "< 100 mΩ" },
    { parametro: "Capacidad de corriente", simulador: "Sin límite", real: "Táctil 6×6 genérico: 50 mA a 12 V DC; Omron B3F: 1–50 mA a 5–24 V DC" },
    { parametro: "Rebote", simulador: "No se modela", real: "Unos pocos ms de rebote al conmutar" },
  ],
  pines: [
    { id: "1", nombre: "Terminal 1", funcion: "Sin polaridad. (El táctil físico tiene 4 patas unidas de dos en dos.)" },
    { id: "2", nombre: "Terminal 2", funcion: "Sin polaridad." },
  ],
  simulador: {
    modelo: [
      "Presionado (closed = sí): conexión ideal de 0 Ω entre 1 y 2. Suelto: circuito abierto, sin rama.",
      "La corriente se obtiene de la restricción ideal que une los dos nodos.",
    ],
    editable: "Botón «presionar» en el componente seleccionado.",
    lecturas: [
      { clave: "pressed / closed", significado: "Si está presionado y si el contacto está cerrado." },
      { clave: "current", significado: "Corriente cuando está cerrado." },
    ],
    limitaciones: ["Sin rebote, por lo que no sirve para practicar técnicas de debounce.", "Si lo pones en paralelo con un cable, el solver reporta restricciones ideales redundantes."],
  },
  pruebas: [
    {
      titulo: "Encender un LED al presionar",
      montaje: "Batería 9 V → pulsador → 470 Ω → LED → batería.",
      pasos: ["Simula con el pulsador suelto.", "Presiónalo y simula de nuevo."],
      esperado: "Suelto: 0 mA y LED apagado. Presionado: ≈14.7 mA y LED encendido.",
    },
  ],
  fallos: [
    { fallo: "Contacto que no cierra", efecto: "No responde al pulsarlo." },
    { fallo: "Contacto pegado", efecto: "Queda cerrado aunque se suelte." },
    { fallo: "Contacto sucio o gastado", efecto: "Lecturas intermitentes o pulsaciones dobles." },
    { fallo: "Montado girado 90° en la protoboard", efecto: "Las patas unidas internamente quedan en la misma fila: siempre conduce, o nunca." },
  ],
  referencias: [{ texto: "Omron — fichas de interruptores", url: "https://components.omron.com/us-en/system/files/2023-01/datasheet_pdf/B036-E1.pdf" }],
};

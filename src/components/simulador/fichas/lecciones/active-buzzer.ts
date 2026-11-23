import type { Leccion } from "../tipos";

export const leccion: Leccion = {
  nivel: "básico",
  duracion: "10 min",
  objetivos: [
    "Diferenciar un zumbador activo de uno pasivo.",
    "Alimentarlo con el voltaje correcto.",
    "Entender por qué una resistencia en serie puede silenciarlo.",
  ],
  secciones: [
    {
      titulo: "Activo y pasivo",
      parrafos: [
        "El activo trae un oscilador interno: con alimentación DC suena a una frecuencia fija. El pasivo necesita una señal que oscile (tone() en Arduino).",
      ],
    },
    {
      titulo: "Alimentación",
      parrafos: [
        "Uno de 5 V consume unos 30 mA. Por debajo de su voltaje suena débil o no suena; muy por encima se daña.",
        "Una resistencia en serie le «roba» voltaje: con 470 Ω y 9 V, al zumbador solo le quedan unos 2.4 V.",
      ],
    },
  ],
  practica: {
    titulo: "¿Suena o no suena?",
    pasos: [
      "Conecta el zumbador a una batería de 5 V y simula.",
      "Baja la batería a 3 V y simula.",
      "Usa 9 V con una resistencia de 470 Ω en serie.",
    ],
    preguntaGuia: "¿Qué resistencia equivalente tiene el zumbador en el modelo? (5 V / 30 mA ≈ 167 Ω.)",
  },
  cuestionario: [
    {
      pregunta: "¿Qué necesita un zumbador activo para sonar?",
      opciones: ["Una señal PWM", "Solo voltaje DC", "Corriente alterna", "Un capacitor"],
      correcta: 1,
      explicacion: "Su oscilador interno genera el tono.",
    },
    {
      pregunta: "Un zumbador de 5 V conectado a 3 V...",
      opciones: ["Suena más fuerte", "Puede no sonar", "Se quema", "Cambia a pasivo"],
      correcta: 1,
      explicacion: "Por debajo de su voltaje nominal el oscilador no arranca bien.",
    },
  ],
};

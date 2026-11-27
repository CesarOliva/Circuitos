import type { Leccion } from "../tipos";
import { leccion as activeBuzzer } from "./active-buzzer";
import { leccion as arduinoUno } from "./arduino-uno-r3";
import { leccion as breadboard } from "./breadboard";
import { leccion as capacitor } from "./capacitor";
import { leccion as dcMotor } from "./dc-motor";
import { leccion as dcVoltageSource } from "./dc-voltage-source";
import { leccion as diode } from "./diode";
import { leccion as esp32 } from "./esp32-devkit-v1";
import { leccion as inductor } from "./inductor";
import { leccion as ldr } from "./ldr";
import { leccion as led } from "./led";
import { leccion as microchip } from "./microchip";
import { leccion as potentiometer } from "./potentiometer";
import { leccion as pushButton } from "./push-button";
import { leccion as resistor } from "./resistor";
import { leccion as switchLeccion } from "./switch";
import { leccion as transistor } from "./transistor-bjt";
import { leccion as ultrasonic } from "./ultrasonic";

/** One lesson per technical sheet, keyed by the sheet's slug. */
export const LECCIONES: Record<string, Leccion> = {
  "dc-voltage-source": dcVoltageSource,
  "dc-motor": dcMotor,
  "active-buzzer": activeBuzzer,
  potentiometer,
  "push-button": pushButton,
  switch: switchLeccion,
  resistor,
  capacitor,
  inductor,
  diode,
  led,
  "transistor-bjt": transistor,
  ldr,
  ultrasonic,
  microchip,
  breadboard,
  "arduino-uno-r3": arduinoUno,
  "esp32-devkit-v1": esp32,
};

import { CATALOG, type Entry } from "../catalog";
import type { Ficha } from "./tipos";
import { LECCIONES } from "./lecciones";
import { ficha as activeBuzzer } from "./active-buzzer";
import { ficha as arduinoUno } from "./arduino-uno-r3";
import { ficha as breadboard } from "./breadboard";
import { ficha as capacitor } from "./capacitor";
import { ficha as dcMotor } from "./dc-motor";
import { ficha as dcVoltageSource } from "./dc-voltage-source";
import { ficha as diode } from "./diode";
import { ficha as esp32 } from "./esp32-devkit-v1";
import { ficha as inductor } from "./inductor";
import { ficha as ldr } from "./ldr";
import { ficha as led } from "./led";
import { ficha as microchip } from "./microchip";
import { ficha as potentiometer } from "./potentiometer";
import { ficha as pushButton } from "./push-button";
import { ficha as resistor } from "./resistor";
import { ficha as switchFicha } from "./switch";
import { ficha as transistor } from "./transistor-bjt";
import { ficha as ultrasonic } from "./ultrasonic";

export type { Ficha, GrupoFicha, Leccion } from "./tipos";
export { LECCIONES } from "./lecciones";

// Gallery order first (so prev/next follows the cards), then the parts without a card.
export const FICHAS: Ficha[] = [
  dcVoltageSource,
  dcMotor,
  activeBuzzer,
  potentiometer,
  pushButton,
  switchFicha,
  resistor,
  capacitor,
  inductor,
  diode,
  led,
  transistor,
  ldr,
  ultrasonic,
  microchip,
  breadboard,
  arduinoUno,
  esp32,
];

export function fichaPorSlug(slug: string): Ficha | undefined {
  return FICHAS.find((ficha) => ficha.slug === slug);
}

/** The gallery entry drawn for this sheet, if the part has a card. */
export function entradaDeFicha(ficha: Ficha): { entry: Entry; index: number } | undefined {
  const index = CATALOG.findIndex((entry) => entry.component.type === ficha.slug);
  return index < 0 ? undefined : { entry: CATALOG[index], index };
}

// Every class in the gallery must have a sheet, and its pins must be the class's terminals; every sheet needs a lesson.
// Runs when the module loads, so a mismatch fails `next build`.
for (const ficha of FICHAS) {
  if (!LECCIONES[ficha.slug]) throw new Error(`Falta la lección de la ficha ${ficha.slug}`);
}
for (const { component, className } of CATALOG) {
  const ficha = fichaPorSlug(component.type);
  if (!ficha) throw new Error(`Falta la ficha técnica de ${className} (type "${component.type}")`);
  const esperados = component.terminals.map((terminal) => terminal.id).join(",");
  const declarados = ficha.pines.map((pin) => pin.id).join(",");
  if (esperados !== declarados) {
    throw new Error(`Ficha ${ficha.slug}: pines [${declarados}] no coinciden con los terminales de ${className} [${esperados}]`);
  }
}

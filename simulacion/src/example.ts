import {
    DCVoltageSource, LDR, UltrasonicSensor, DCMotor, Potentiometer, PushButton,
    Switch, Transistor, Diode, Inductor, Capacitor,
    ElectronicComponent,
} from "./index.ts";

const components: ElectronicComponent[] = [
    new DCVoltageSource("V1", 5, 1),
    new LDR("LDR1"),
    new UltrasonicSensor("US1"),
    new DCMotor("M1", 6, 0.45, 30_000),
    new Potentiometer("RV1", 10_000),
    new PushButton("SW1", "NO"),
    new Switch("SW2"),
    new Transistor("Q1", "NPN", 100, 0.6, 40),
    new Diode("D1", 0.7, 1, 50),
    new Inductor("L1", 0.01, 0.5),
    new Capacitor("C1", 100e-6, 16, true),
];

for (const component of components) {
    console.log(
        component.id,
        component.type,
        component.getProperties()
    );
}
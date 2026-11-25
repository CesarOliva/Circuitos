import type { ReactNode } from "react";
import type { ComponentScene } from "@/content";
import { LedSymbol, Resistor, Source, flow } from "./scene-parts";

// Escenas de las lecciones de cada componente. Comparten lienzo (760 × 230) y estilos con el resto de escenas.

function Frame({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 760 230" role="img" aria-labelledby="circuit-title circuit-description">
      <title id="circuit-title">{title}</title>
      <desc id="circuit-description">{description}</desc>
      {children}
    </svg>
  );
}

function Wire({ d, seconds, className = "" }: { d: string; seconds?: number; className?: string }) {
  return (
    <>
      <path className="scene-wire" d={d} />
      <path className={`scene-current ${className}`} d={d} style={seconds ? flow(seconds) : undefined} />
    </>
  );
}

function Source1() {
  const wire = "M116 112 H420 M494 112 H650 V190 H72 V112 H100";
  return (
    <Frame title="La batería DC" description="Una fuente de 9 voltios con su terminal positivo a la derecha. La corriente sale por el positivo, recorre la carga y regresa por el negativo.">
      <Wire d={wire} />
      <Source x={100} label="V1 = 9 V" />
      <text className="scene-note" x="132" y="100">+</text>
      <text className="scene-note" x="84" y="100" textAnchor="end">−</text>
      <Resistor x={420} label="CARGA" labelY={74} />
      <circle className="scene-node" cx="72" cy="112" r="5" />
      <circle className="scene-node" cx="650" cy="112" r="5" />
      <text className="scene-note" x="72" y="218">LA PLACA LARGA ES EL POSITIVO · LA CORRIENTE SALE POR + Y REGRESA POR −</text>
    </Frame>
  );
}

function ResistorBands() {
  return (
    <Frame title="El resistor y su código de colores" description="Un resistor con cuatro bandas de color: marrón, negro, rojo y dorado, que indican 1 kiloohmio con tolerancia del 5 por ciento.">
      <Wire d="M100 112 H280 M480 112 H660" seconds={2.4} />
      <rect x="280" y="92" width="200" height="40" rx="20" fill="#e7c895" stroke="#b8985e" strokeWidth="1.5" />
      <rect x="296" y="96" width="168" height="6" rx="3" fill="#fff" opacity="0.45" />
      <rect x="318" y="92" width="14" height="40" fill="#6b3a1e" />
      <rect x="348" y="92" width="14" height="40" fill="#111" />
      <rect x="378" y="92" width="14" height="40" fill="#c0392b" />
      <rect x="430" y="92" width="14" height="40" fill="#d4a72c" />
      <g className="scene-part">
        <text x="325" y="160" textAnchor="middle">1</text>
        <text x="355" y="160" textAnchor="middle">0</text>
        <text x="385" y="160" textAnchor="middle">× 100</text>
        <text x="437" y="160" textAnchor="middle">± 5 %</text>
        <text x="380" y="68" textAnchor="middle">10 × 100 = 1000 Ω = 1 kΩ</text>
      </g>
      <text className="scene-note" x="100" y="218">MARRÓN · NEGRO · ROJO · DORADO · TAMBIÉN AGUANTA 0.25 W DE POTENCIA</text>
    </Frame>
  );
}

function Inductor() {
  const wire = "M116 112 H200 M274 112 H400 M512 112 H650 V190 H72 V112 H100";
  return (
    <Frame title="Un inductor en un circuito" description="Una fuente de 9 voltios, un resistor de 1 kiloohmio y un inductor de 10 milihenrios en serie. Alrededor de la bobina se forma un campo magnético.">
      <Wire d={wire} />
      <Source x={100} label="9 V" />
      <Resistor x={200} label="R = 1 kΩ" labelY={74} />
      <ellipse className="scene-field" cx="456" cy="112" rx="72" ry="36" />
      <ellipse className="scene-field scene-field-late" cx="456" cy="112" rx="94" ry="52" />
      <g className="scene-part">
        <path d="M400 112 a14 14 0 0 1 28 0 a14 14 0 0 1 28 0 a14 14 0 0 1 28 0 a14 14 0 0 1 28 0" />
        <text x="456" y="34" textAnchor="middle">L = 10 mH · 2 Ω</text>
        <text x="456" y="182" textAnchor="middle">CAMPO MAGNÉTICO</text>
      </g>
      <circle className="scene-node" cx="72" cy="112" r="5" />
      <circle className="scene-node" cx="650" cy="112" r="5" />
      <text className="scene-note" x="72" y="212">τ = L / R ≈ 10 mH / 1 kΩ = 10 µs</text>
      <text className="scene-note" x="72" y="228">CON LA CORRIENTE YA ESTABLE, LA BOBINA SOLO OFRECE SUS 2 Ω</text>
    </Frame>
  );
}

function SwitchLoop({ x, closed }: { x: number; closed: boolean }) {
  const wire = closed
    ? "M56 112 H190 M264 112 H290 V190 H0 V112 H40"
    : "M56 112 H90 M150 112 H190 M264 112 H290 V190 H0 V112 H40";
  return (
    <g transform={`translate(${x} 0)`}>
      <path className="scene-wire" d={wire} />
      {closed && <path className="scene-current" d={wire} style={flow(1.8)} />}
      <Source x={40} label="9 V" />
      <g className="scene-part">
        <path d={closed ? "M90 112 H150" : "M90 112 L140 82"} />
        <text x="120" y="152" textAnchor="middle">{closed ? "CERRADO" : "ABIERTO"}</text>
      </g>
      <circle className="scene-node" cx="90" cy="112" r="5" />
      <circle className="scene-node" cx="150" cy="112" r="5" />
      <Resistor x={190} label="R = 1 kΩ" labelY={74} />
    </g>
  );
}

function SwitchScene() {
  return (
    <Frame title="El interruptor" description="Dos circuitos iguales. Con el interruptor abierto no hay camino y no circula corriente. Con el interruptor cerrado circulan 9 miliamperios.">
      <SwitchLoop x={30} closed={false} />
      <SwitchLoop x={410} closed />
      <text className="scene-note" x="30" y="218">ABIERTO · CAMINO CORTADO · I = 0</text>
      <text className="scene-note" x="410" y="218">CERRADO · CAMINO LIBRE · I = 9 mA</text>
    </Frame>
  );
}

function ButtonScene() {
  const wire = "M116 112 H160 M234 112 H300 M400 112 H480 M524 112 H650 V190 H72 V112 H100";
  return (
    <Frame title="El pulsador" description="Un circuito con una fuente, un resistor, un pulsador normalmente abierto y un LED. El LED solo se enciende mientras el pulsador está presionado.">
      <path className="scene-wire" d={wire} />
      <path className="scene-current scene-press-flow" d={wire} />
      <circle className="scene-led-glow scene-press-glow" cx="502" cy="112" r="40" />
      <Source x={100} label="9 V" />
      <Resistor x={160} label="R = 470 Ω" labelY={74} />
      <circle className="scene-node" cx="300" cy="112" r="5" />
      <circle className="scene-node" cx="400" cy="112" r="5" />
      <g className="scene-press">
        <path className="scene-line" d="M296 90 H404 M350 90 V56 M336 56 H364" />
      </g>
      <text className="scene-note" x="350" y="152" textAnchor="middle">PULSADOR</text>
      <LedSymbol x={480} label="LED" />
      <text className="scene-note" x="72" y="218">NORMALMENTE ABIERTO (NO) · CONDUCE SOLO MIENTRAS LO PRESIONAS</text>
    </Frame>
  );
}

function Potentiometer() {
  return (
    <Frame title="El potenciómetro" description="Un potenciómetro de 10 kiloohmios conectado entre 9 voltios y tierra. El cursor se desliza por la pista y toma una fracción del voltaje.">
      <Wire d="M116 112 H250 M510 112 H650 V190 H72 V112 H100" seconds={2.4} />
      <Source x={100} label="9 V" />
      <rect className="scene-body" x="250" y="100" width="260" height="24" rx="4" />
      <g transform="translate(250 0)">
        <g className="scene-wiper">
          <path className="scene-line" d="M0 62 V98 M-7 89 L0 100 L7 89" />
          <text className="scene-note" x="0" y="48" textAnchor="middle">W · CURSOR</text>
        </g>
      </g>
      <text className="scene-note" x="250" y="152" textAnchor="middle">A · 9 V</text>
      <text className="scene-note" x="510" y="152" textAnchor="middle">B · 0 V</text>
      <text className="scene-note" x="380" y="152" textAnchor="middle">10 kΩ</text>
      <text className="scene-note" x="72" y="218">CON A A 9 V Y B A 0 V, Vout BAJA AL ACERCARSE A B · EN EL 50 % SALEN 4.5 V</text>
    </Frame>
  );
}

function DiodeLoop({ x, forward }: { x: number; forward: boolean }) {
  const wire = "M56 112 H110 M170 112 H190 M264 112 H290 V190 H0 V112 H40";
  return (
    <g transform={`translate(${x} 0)`}>
      <path className="scene-wire" d={wire} />
      {forward && <path className="scene-current" d={wire} style={flow(1.8)} />}
      <Source x={40} label="9 V" />
      <g className="scene-part">
        <path d={forward ? "M110 112 H124 M124 94 V130 L152 112 Z M152 94 V130 M152 112 H170" : "M110 112 H128 M156 94 V130 L128 112 Z M128 94 V130 M156 112 H170"} />
        <text x="140" y="152" textAnchor="middle">{forward ? "CONDUCE" : "BLOQUEA"}</text>
      </g>
      <Resistor x={190} label="R = 1 kΩ" labelY={74} />
      <circle className="scene-node" cx="0" cy="112" r="5" />
      <circle className="scene-node" cx="290" cy="112" r="5" />
    </g>
  );
}

function DiodeScene() {
  return (
    <Frame title="El diodo" description="Dos circuitos con la misma fuente. Con el diodo en sentido directo la corriente circula y el diodo se queda con 0.7 voltios. Con el diodo al revés bloquea y no circula corriente.">
      <DiodeLoop x={30} forward />
      <DiodeLoop x={410} forward={false} />
      <text className="scene-note" x="30" y="218">DIRECTA · VF ≈ 0.7 V · I = 8.3 mA</text>
      <text className="scene-note" x="410" y="218">INVERSA · I ≈ 0 · AGUANTA HASTA 50 V</text>
    </Frame>
  );
}

function Ldr() {
  const wire = "M116 112 H200 M274 112 H386 M460 112 H650 V190 H72 V112 H100";
  return (
    <Frame title="La fotorresistencia" description="Un divisor de voltaje formado por un resistor fijo de 10 kiloohmios y una fotorresistencia. Cuando le llega más luz, la fotorresistencia baja su resistencia y cambia el voltaje de salida.">
      <path className="scene-wire" d={wire} />
      <path className="scene-current" d={wire} />
      <path className="scene-probe" d="M330 112 V190" />
      <Source x={100} label="9 V" />
      <Resistor x={200} label="R = 10 kΩ" labelY={74} />
      <circle className="scene-ring" cx="423" cy="112" r="48" />
      <Resistor x={386} label="" labelY={0} />
      <g className="scene-light">
        <path className="scene-line" d="M340 38 L372 70 M372 70 H362 M372 70 V60" />
        <path className="scene-line" d="M364 24 L396 56 M396 56 H386 M396 56 V46" />
      </g>
      <text className="scene-note" x="330" y="24" textAnchor="middle">LUZ</text>
      <text className="scene-note" x="423" y="176" textAnchor="middle">LDR · 10 kΩ A 10 lx</text>
      <text className="scene-note" x="318" y="156" textAnchor="end">Vout = 4.5 V</text>
      <circle className="scene-node" cx="330" cy="112" r="5" />
      <circle className="scene-node" cx="330" cy="190" r="5" />
      <text className="scene-note" x="72" y="218">MÁS LUZ → MENOS RESISTENCIA · LA SALIDA CAE: 7.5 V A 1 lx · 4.5 V A 10 lx · 1.5 V A 100 lx</text>
    </Frame>
  );
}

function Ultrasonic() {
  const wave = (x: number, delay: number, echo: boolean) => (
    <path
      key={`${echo}-${x}`}
      className={echo ? "scene-pong" : "scene-ping"}
      d={echo ? `M${x} 90 q -14 22 0 44` : `M${x} 90 q 14 22 0 44`}
      style={{ animationDelay: `${delay}s` }}
    />
  );
  return (
    <Frame title="El sensor ultrasónico" description="Un sensor envía un pulso de sonido, el sonido rebota en un objeto y regresa. El tiempo de ida y vuelta permite calcular la distancia.">
      <rect className="scene-body" x="80" y="72" width="90" height="80" rx="8" />
      <circle className="scene-ring" cx="105" cy="112" r="16" />
      <circle className="scene-ring" cx="145" cy="112" r="16" />
      <text className="scene-note" x="125" y="172" textAnchor="middle">VCC · TRIG · ECHO · GND</text>
      <rect className="scene-body" x="600" y="56" width="20" height="112" rx="3" />
      {[190, 208, 226].map((x, index) => wave(x, index * 0.06, false))}
      {[190, 208, 226].map((x, index) => wave(x, index * 0.06, true))}
      <path className="scene-dim" d="M170 200 H600 M170 192 V208 M600 192 V208" />
      <text className="scene-note" x="385" y="192" textAnchor="middle">d = 50 cm</text>
      <text className="scene-note" x="72" y="226">d = v · t / 2 · SONIDO ≈ 343 m/s · IDA Y VUELTA DE 100 cm ≈ 2.9 ms</text>
    </Frame>
  );
}

function Motor() {
  const wire = "M116 112 H410 M490 112 H650 V190 H72 V112 H100";
  return (
    <Frame title="El motor de corriente continua" description="Una fuente de 6 voltios alimenta un motor DC. Al circular corriente por el motor, su eje gira.">
      <Wire d={wire} seconds={1.2} />
      <Source x={100} label="6 V" />
      <circle className="scene-body" cx="450" cy="112" r="40" />
      <g className="scene-spin">
        <path className="scene-line" d="M450 84 V140 M422 112 H478" />
      </g>
      <text className="scene-note" x="450" y="56" textAnchor="middle">MOTOR DC</text>
      <text className="scene-note" x="450" y="176" textAnchor="middle">9000 rpm SIN CARGA</text>
      <text className="scene-note" x="398" y="102" textAnchor="end">+</text>
      <circle className="scene-node" cx="72" cy="112" r="5" />
      <circle className="scene-node" cx="650" cy="112" r="5" />
      <text className="scene-note" x="72" y="218">6 V NOMINALES · 70 mA SIN CARGA · HASTA 1.2 A SI EL EJE SE BLOQUEA</text>
    </Frame>
  );
}

function Buzzer() {
  const wire = "M116 112 H416 M484 112 H650 V190 H72 V112 H100";
  return (
    <Frame title="El buzzer activo" description="Una fuente de 5 voltios alimenta un buzzer activo. Al recibir corriente continua, el buzzer emite un tono por sí solo.">
      <Wire d={wire} seconds={2} />
      <Source x={100} label="5 V" />
      <circle className="scene-body" cx="450" cy="112" r="34" />
      <path className="scene-wave" d="M425 68.7 A50 50 0 0 1 475 68.7" />
      <path className="scene-wave scene-wave-2" d="M418 56.6 A64 64 0 0 1 482 56.6" />
      <path className="scene-wave scene-wave-3" d="M411 44.5 A78 78 0 0 1 489 44.5" />
      <text className="scene-note" x="404" y="104" textAnchor="end">+</text>
      <text className="scene-note" x="450" y="172" textAnchor="middle">BUZZER ACTIVO</text>
      <circle className="scene-node" cx="72" cy="112" r="5" />
      <circle className="scene-node" cx="650" cy="112" r="5" />
      <text className="scene-note" x="72" y="218">5 V · 30 mA · EL OSCILADOR VA DENTRO: SOLO NECESITA CORRIENTE CONTINUA</text>
    </Frame>
  );
}

function Transistor() {
  const main = "M116 112 H160 V40 H240 M314 40 H450 V84 M450 156 V190 H72 V112 H100";
  const base = "M200 120 H240 M314 120 H400";
  return (
    <Frame title="El transistor BJT como interruptor" description="Una pequeña corriente por la base de un transistor NPN permite que circule una corriente mucho mayor entre el colector y el emisor, hacia la carga.">
      <path className="scene-wire" d={`${main} ${base}`} />
      <path className="scene-current" d={main} style={flow(1.2)} />
      <path className="scene-current" d={base} style={flow(3.6)} />
      <Source x={100} label="5 V" />
      <Resistor x={240} y={40} label="CARGA" labelY={22} />
      <Resistor x={240} y={120} label="Rb = 1 kΩ" labelY={102} />
      <circle className="scene-ring" cx="416" cy="120" r="44" />
      <g className="scene-part">
        <path d="M400 92 V148 M400 108 L450 84 M400 132 L450 156" />
        <path className="scene-arrowhead" d="M450 156 L438.8 156.2 L443.2 147.2 Z" />
      </g>
      <text className="scene-note" x="390" y="84" textAnchor="end">B</text>
      <text className="scene-note" x="466" y="70">C</text>
      <text className="scene-note" x="466" y="170">E</text>
      <text className="scene-note" x="200" y="146">ENTRADA</text>
      <text className="scene-note" x="500" y="66">Ic = 30 mA</text>
      <text className="scene-note" x="500" y="126">Ib = 4.3 mA</text>
      <circle className="scene-node" cx="200" cy="120" r="5" />
      <text className="scene-note" x="72" y="218">UNA CORRIENTE PEQUEÑA EN LA BASE CONTROLA UNA GRANDE EN EL COLECTOR</text>
    </Frame>
  );
}

function Mcu() {
  const inputs = [
    { y: 70, name: "PULSADOR" },
    { y: 112, name: "FOTORRESISTENCIA" },
    { y: 154, name: "ULTRASÓNICO" },
  ];
  const outputs = [
    { y: 70, name: "LED" },
    { y: 112, name: "BUZZER" },
    { y: 154, name: "MOTOR (+ TRANSISTOR)" },
  ];
  return (
    <Frame title="Qué hace un microcontrolador" description="Un microcontrolador recibe señales de entrada de sensores y botones, ejecuta el programa y activa salidas como LEDs, buzzers y motores.">
      {inputs.map(({ y }) => <Wire key={`in-${y}`} d={`M200 ${y} H300`} seconds={2} />)}
      {outputs.map(({ y }) => <Wire key={`out-${y}`} d={`M460 ${y} H560`} seconds={2} />)}
      {inputs.map(({ y, name }) => (
        <g key={name}>
          <rect className="scene-body" x="40" y={y - 16} width="160" height="32" rx="6" />
          <text className="scene-note" x="120" y={y + 4} textAnchor="middle">{name}</text>
        </g>
      ))}
      {outputs.map(({ y, name }) => (
        <g key={name}>
          <rect className="scene-body" x="560" y={y - 16} width="160" height="32" rx="6" />
          <text className="scene-note" x="640" y={y + 4} textAnchor="middle">{name}</text>
        </g>
      ))}
      <rect className="scene-body" x="300" y="40" width="160" height="150" rx="10" />
      <text className="scene-note" x="380" y="76" textAnchor="middle">1 · LEE ENTRADAS</text>
      <text className="scene-note" x="380" y="120" textAnchor="middle">2 · DECIDE (SKETCH)</text>
      <text className="scene-note" x="380" y="164" textAnchor="middle">3 · ACTIVA SALIDAS</text>
      <text className="scene-note" x="120" y="28" textAnchor="middle">ENTRADAS</text>
      <text className="scene-note" x="640" y="28" textAnchor="middle">SALIDAS</text>
      <text className="scene-note" x="40" y="218">EL PROGRAMA SE REPITE SIN PARAR: loop()</text>
    </Frame>
  );
}

const PIN_STEP = 31.5;

function Pin({ x, y, name, labelY, input = false }: { x: number; y: number; name: string; labelY: number; input?: boolean }) {
  return (
    <g>
      <rect className={input ? "scene-pin scene-pin-hot" : "scene-pin"} x={x - 4} y={y} width="8" height="12" rx="1.5" />
      <text className="scene-pinname" x={x} y={labelY} textAnchor="middle">{name}</text>
    </g>
  );
}

function Uno() {
  const digital = Array.from({ length: 14 }, (_, index) => `D${index}`);
  const power = ["5V", "3V3", "GND", "VIN"];
  const analog = Array.from({ length: 6 }, (_, index) => `A${index}`);
  return (
    <Frame title="Arduino UNO R3" description="La placa Arduino UNO con sus pines digitales D0 a D13 en la parte superior, y sus pines de alimentación y analógicos A0 a A5 en la inferior.">
      <rect className="scene-board" x="130" y="30" width="500" height="156" rx="10" />
      {digital.map((name, index) => <Pin key={name} x={175 + index * PIN_STEP} y={36} name={name} labelY={64} />)}
      {power.map((name, index) => <Pin key={name} x={175 + index * PIN_STEP} y={168} name={name} labelY={160} />)}
      {analog.map((name, index) => <Pin key={name} x={420 + index * PIN_STEP} y={168} name={name} labelY={160} />)}
      <rect className="scene-body" x="290" y="82" width="150" height="48" rx="4" />
      <text className="scene-note" x="365" y="111" textAnchor="middle">ATmega328P</text>
      <text className="scene-note" x="380" y="26" textAnchor="middle">PINES DIGITALES</text>
      <text className="scene-note" x="640" y="130">ANALÓGICOS</text>
      <text className="scene-note" x="640" y="144">A0 – A5</text>
      <text className="scene-note" x="130" y="212">ARDUINO UNO R3 · 5 V · 16 MHz · 20 PINS (D0–D13 + A0–A5)</text>
      <text className="scene-note" x="130" y="228">ENTRADA ANALÓGICA DE 10 BITS: 0 – 1023</text>
    </Frame>
  );
}

function Esp32() {
  const top = ["EN", "36", "39", "34", "35", "32", "33", "25", "26", "27", "14", "12", "13", "GND", "VIN"];
  const bottom = ["23", "22", "TX0", "RX0", "21", "19", "18", "5", "TX2", "RX2", "4", "0", "2", "15", "GND"];
  const inputOnly = new Set(["36", "39", "34", "35"]);
  return (
    <Frame title="ESP32 DevKit V1" description="La placa ESP32 DevKit V1 con 15 pines en cada borde. Los pines GPIO 34, 35, 36 y 39 están resaltados porque solo funcionan como entrada.">
      <rect className="scene-board" x="130" y="30" width="500" height="156" rx="10" />
      <rect className="scene-body" x="118" y="96" width="44" height="34" rx="4" />
      <text className="scene-pinname" x="140" y="117" textAnchor="middle">USB</text>
      {top.map((name, index) => <Pin key={`t-${index}`} x={160 + index * 30} y={36} name={name} labelY={64} input={inputOnly.has(name)} />)}
      {bottom.map((name, index) => <Pin key={`b-${index}`} x={160 + index * 30} y={168} name={name} labelY={160} />)}
      <rect className="scene-body" x="420" y="84" width="170" height="44" rx="4" />
      <text className="scene-note" x="505" y="111" textAnchor="middle">ESP32 · WiFi · BT</text>
      <text className="scene-note" x="380" y="26" textAnchor="middle">NÚMERO DE GPIO</text>
      <text className="scene-note" x="130" y="212">ESP32 DEVKIT V1 · 3.3 V · 240 MHz · ENTRADA ANALÓGICA DE 12 BITS: 0 – 4095</text>
      <text className="scene-note" x="130" y="228">RESALTADOS: GPIO34, 35, 36 Y 39 SOLO SIRVEN COMO ENTRADA</text>
    </Frame>
  );
}

function GpioOut() {
  const wire = "M170 112 H260 M334 112 H430 M474 112 H520 H650 V190 H115 V162";
  return (
    <Frame title="Encender un LED desde un pin" description="Un pin del microcontrolador alimenta un resistor y un LED en serie. Cuando el pin está en alto, el LED se enciende; cuando está en bajo, se apaga.">
      <path className="scene-wire" d={wire} />
      <path className="scene-current scene-blink" d={wire} />
      <circle className="scene-led-glow scene-blink-glow" cx="452" cy="112" r="40" />
      <rect className="scene-body" x="60" y="62" width="110" height="100" rx="8" />
      <text className="scene-note" x="115" y="100" textAnchor="middle">MCU</text>
      <text className="scene-note" x="115" y="124" textAnchor="middle">PIN D13</text>
      <text className="scene-note" x="115" y="180" textAnchor="middle">GND</text>
      <Resistor x={260} label="R = 220 Ω" labelY={74} />
      <LedSymbol x={430} label="LED" />
      <circle className="scene-node" cx="170" cy="112" r="5" />
      <text className="scene-note" x="72" y="208">ARDUINO (5 V): I = (5 V − 2 V) / 220 Ω ≈ 13.6 mA</text>
      <text className="scene-note" x="72" y="226">ESP32 (3.3 V): I = (3.3 V − 2 V) / 220 Ω ≈ 5.9 mA</text>
    </Frame>
  );
}

function Adc() {
  const row = (y: number, name: string, top: string, mid: string, tail: string) => (
    <g key={name}>
      <text className="scene-note" x="140" y={y - 10}>{name}</text>
      <rect className="scene-body" x="140" y={y} width="480" height="24" rx="4" />
      <rect className="scene-sweep" x="140" y={y} width="480" height="24" rx="4" />
      <path className="scene-dim" d={`M380 ${y + 24} V${y + 32}`} />
      <text className="scene-note" x="140" y={y + 46}>{top}</text>
      <text className="scene-note" x="380" y={y + 46} textAnchor="middle">{mid}</text>
      <text className="scene-note" x="620" y={y + 46} textAnchor="end">{tail}</text>
    </g>
  );
  return (
    <Frame title="De voltaje a número" description="El conversor analógico-digital convierte un voltaje en un número. El Arduino UNO usa 1024 niveles entre 0 y 5 voltios; el ESP32 usa 4096 niveles entre 0 y 3.3 voltios.">
      {row(56, "ARDUINO UNO · 5 V", "0 V → 0", "2.5 V → ≈ 512", "5 V → 1023")}
      {row(132, "ESP32 · 3.3 V", "0 V → 0", "1.65 V → ≈ 2048", "3.3 V → 4095")}
      <text className="scene-note" x="140" y="224">EL ESP32 DISTINGUE MÁS PASOS (4096 FRENTE A 1024), PERO SU ESCALA TERMINA EN 3.3 V</text>
    </Frame>
  );
}

export const COMPONENT_SCENES: Record<ComponentScene, { Drawing: () => React.JSX.Element; caption: string }> = {
  source: { Drawing: Source1, caption: "La fuente empuja la corriente por su positivo y la recibe de vuelta por el negativo." },
  resistor: { Drawing: ResistorBands, caption: "Las bandas de color son el valor del resistor escrito en código: dos dígitos, un multiplicador y la tolerancia." },
  inductor: { Drawing: Inductor, caption: "Una bobina con corriente crea un campo magnético; por eso se opone a que la corriente cambie de golpe." },
  switch: { Drawing: SwitchScene, caption: "El interruptor mantiene el camino cortado o libre hasta que alguien lo cambie." },
  button: { Drawing: ButtonScene, caption: "El pulsador cierra el circuito mientras se presiona y lo abre al soltarlo." },
  potentiometer: { Drawing: Potentiometer, caption: "Al deslizar el cursor, el voltaje de salida sube y baja entre 0 V y 9 V." },
  diode: { Drawing: DiodeScene, caption: "El diodo es una válvula de un solo sentido: conduce de ánodo a cátodo y bloquea al revés." },
  ldr: { Drawing: Ldr, caption: "Más luz, menos resistencia: la fotorresistencia convierte la iluminación en un voltaje." },
  ultrasonic: { Drawing: Ultrasonic, caption: "El sensor mide cuánto tarda el eco en volver y de ahí calcula la distancia." },
  motor: { Drawing: Motor, caption: "La corriente que atraviesa el motor se convierte en giro del eje." },
  buzzer: { Drawing: Buzzer, caption: "El buzzer activo suena en cuanto lo alimentas: no hace falta generar la señal de audio." },
  transistor: { Drawing: Transistor, caption: "La corriente de base, pequeña, abre paso a la corriente de colector, mucho mayor." },
  mcu: { Drawing: Mcu, caption: "Leer, decidir, actuar: el microcontrolador repite este ciclo millones de veces por segundo." },
  uno: { Drawing: Uno, caption: "El Arduino UNO trabaja a 5 V y tiene 14 pines digitales y 6 analógicos." },
  esp32: { Drawing: Esp32, caption: "El ESP32 trabaja a 3.3 V, es mucho más rápido y tiene pines que solo sirven como entrada." },
  "gpio-out": { Drawing: GpioOut, caption: "Un pin en alto empuja corriente por el resistor y el LED; en bajo, el LED se apaga." },
  adc: { Drawing: Adc, caption: "Cada placa reparte su escala de voltaje en un número distinto de pasos." },
};

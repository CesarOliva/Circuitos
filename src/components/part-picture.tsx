import type { ReactNode } from "react";

// Small pictures of the real parts, for the tray and the drag preview. 48 × 48, lit from the top left.
const STEEL = "#a7aeb6";
const SHINE = "rgb(255 255 255 / 45%)";

const leg = (d: string, colour = STEEL, width = 1.6) => <path d={d} fill="none" stroke={colour} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />;

const PICTURES: Record<string, ReactNode> = {
  breadboard: <>
    <rect x="3" y="8" width="42" height="33" rx="2.5" fill="#e4e2da" />
    <rect x="3" y="23.6" width="42" height="1.8" fill="#c6c3ba" />
    {[[9.6, "#d8433f"], [16.6, "#2c6fd1"], [32.4, "#2c6fd1"], [39.4, "#d8433f"]].map(([y, colour]) => <rect key={y} x="6" y={Number(y) - 0.3} width="36" height=".6" fill={String(colour)} />)}
    {[11.6, 14, 19, 21.4, 27.6, 30, 35, 37.4].map(y => Array.from({ length: 13 }, (_, index) => <rect key={`${y}-${index}`} x={6.6 + index * 2.8} y={y - 0.6} width="1.2" height="1.2" fill="#2b2b2f" />))}
    <rect x="4.5" y="8.5" width="39" height=".7" rx=".35" fill={SHINE} opacity=".7" />
  </>,
  battery: <>
    <rect x="12" y="13" width="24" height="32" rx="3" fill="#2b2b2f" />
    <rect x="12" y="21" width="24" height="16" fill="#c99a2e" />
    <text x="24" y="32.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="#2b2b2f" fontFamily="Arial, sans-serif">9V</text>
    <rect x="13" y="10" width="22" height="4" rx="1.5" fill="#c4c8ce" />
    <circle cx="19" cy="8" r="3" fill="#d3d7dc" stroke="#8d9198" strokeWidth=".8" />
    <path d="m29 4.6 2.9 1.7v3.4L29 11.4l-2.9-1.7V6.3z" fill="#d3d7dc" stroke="#8d9198" strokeWidth=".8" />
    <rect x="14" y="15" width="2" height="28" rx="1" fill={SHINE} opacity=".35" />
  </>,
  resistor: <>
    {leg("M2 24h44")}
    <path d="M10 19q0-3 3.5-3h3q2 0 3 1.6h9q1-1.6 3-1.6h3q3.5 0 3.5 3v10q0 3-3.5 3h-3q-2 0-3-1.6h-9q-1 1.6-3 1.6h-3Q10 32 10 29z" fill="#d8c49b" />
    <rect x="14" y="16.4" width="2.4" height="15.2" fill="#e6c23a" />
    <rect x="19" y="17.6" width="2.4" height="12.8" fill="#8a55c9" />
    <rect x="23.8" y="17.6" width="2.4" height="12.8" fill="#8b5a2b" />
    <rect x="31.6" y="16.4" width="2.4" height="15.2" fill="#c9a443" />
    <rect x="11.5" y="18.5" width="25" height="2" rx="1" fill={SHINE} />
  </>,
  led: <>
    {leg("M21 31v15")}
    {leg("M27 31v4l2.6 2.6V46")}
    <path d="M16 30V17a8 8 0 0 1 16 0v13z" fill="#e5484d" />
    <rect x="14.5" y="28" width="19" height="4" rx="1.2" fill="#c9353a" />
    <path d="M19.5 16.5a4.6 4.6 0 0 1 3.6-4.2" fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="2" strokeLinecap="round" />
    <rect x="18.5" y="19" width="2" height="7" rx="1" fill={SHINE} />
  </>,
  diode: <>
    {leg("M2 24h44")}
    <rect x="13" y="19" width="22" height="10" rx="3" fill="#26262a" />
    <rect x="28" y="19" width="3" height="10" fill="#c4c8ce" />
    <rect x="15" y="20.5" width="18" height="1.6" rx=".8" fill={SHINE} opacity=".6" />
  </>,
  capacitor: <>
    {leg("M20 38v8")}
    {leg("M28 38v6")}
    <rect x="13" y="5" width="22" height="34" rx="3" fill="#2f4579" />
    <rect x="13" y="5" width="22" height="4" rx="2" fill="#b7bcc4" />
    <rect x="29" y="9" width="4" height="27" fill="#dfe5ee" opacity=".9" />
    <path d="M30 14h2m-2 6h2m-2 6h2m-2 6h2" stroke="#2f4579" strokeWidth="1.2" />
    <rect x="13" y="35" width="22" height="4" rx="1.5" fill="#1d1d20" />
    <rect x="16" y="10" width="2.2" height="24" rx="1.1" fill={SHINE} opacity=".5" />
  </>,
  inductor: <>
    {leg("M2 26h44", "#c07a45")}
    <rect x="11" y="15" width="4" height="22" rx="1.6" fill="#3d3d41" />
    <rect x="33" y="15" width="4" height="22" rx="1.6" fill="#3d3d41" />
    <rect x="15" y="20" width="18" height="12" fill="#4a4a4e" />
    {[16, 19, 22, 25, 28, 31].map(x => <rect key={x} x={x - 0.2} y="18" width="2.4" height="16" rx="1.2" fill={x % 2 ? "#c87f45" : "#b06a35"} />)}
    <rect x="15" y="19.5" width="18" height="1.4" rx=".7" fill={SHINE} opacity=".6" />
  </>,
  switch: <>
    <rect x="17" y="39" width="2.4" height="7" fill="#c9a24a" />
    <rect x="28.6" y="39" width="2.4" height="7" fill="#c9a24a" />
    <rect x="12" y="24" width="24" height="16" rx="2.5" fill="#2b2b2f" />
    <rect x="15" y="21" width="18" height="4" rx="1" fill="#9aa0a6" />
    <rect x="19" y="17" width="10" height="5" fill="#c4c8ce" />
    <path d="m24 18 8-13" stroke="#c4c8ce" strokeWidth="3.4" strokeLinecap="round" />
    <path d="m24 18 8-13" stroke="#fff" strokeOpacity=".5" strokeWidth="1" strokeLinecap="round" />
    <rect x="14" y="26" width="20" height="1.6" rx=".8" fill={SHINE} opacity=".35" />
  </>,
  "push-button": <>
    {leg("M13 35v4l-2 2v5")}
    {leg("M35 35v4l2 2v5")}
    <rect x="10" y="22" width="28" height="14" rx="2" fill="#2b2b2f" />
    <rect x="9" y="19" width="30" height="4" rx="1" fill="#c4c8ce" />
    <rect x="16" y="8" width="16" height="12" rx="4" fill="#4a4b50" />
    <rect x="18" y="10" width="12" height="2" rx="1" fill={SHINE} opacity=".5" />
  </>,
  potentiometer: <>
    {[16, 24, 32].map(x => <rect key={x} x={x - 1.2} y="37" width="2.4" height="9" fill="#c4c8ce" />)}
    <rect x="9" y="22" width="30" height="16" rx="3" fill="#2b2b2f" />
    <rect x="17" y="15" width="14" height="8" rx="1" fill="#c4c8ce" />
    <rect x="20" y="3" width="8" height="13" rx="1" fill="#d3d7dc" />
    <path d="M22 5v9m2-9v9m2-9v9" stroke="#9aa0a6" strokeWidth=".8" />
    <rect x="11" y="24" width="26" height="1.6" rx=".8" fill={SHINE} opacity=".35" />
  </>,
  ldr: <>
    {leg("M21 28v18", STEEL, 1.4)}
    {leg("M27 28v18", STEEL, 1.4)}
    <circle cx="24" cy="18" r="12" fill="#e7ddc6" stroke="#cbbd9d" />
    <path d="M17 11.5h14v3H17v3h14v3H17v3h14" fill="none" stroke="#c2562b" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M15.5 13a10 10 0 0 1 5-5" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="1.6" strokeLinecap="round" />
  </>,
  ultrasonic: <>
    {[18.5, 22.5, 26.5, 30.5].map(x => <rect key={x} x={x - 0.7} y="36" width="1.4" height="9" fill="#d9b44a" />)}
    <rect x="3" y="11" width="42" height="26" rx="2" fill="#2f62a6" />
    {[13.5, 34.5].map(x => <g key={x}>
      <circle cx={x} cy="24" r="9.5" fill="#c4c8ce" />
      <circle cx={x} cy="24" r="7" fill="#55585e" />
      <path d={`M${x - 5} 21h10M${x - 6} 24h12M${x - 5} 27h10M${x - 3} 19v10M${x} 18v12M${x + 3} 19v10`} stroke="#7a7e85" strokeWidth=".6" />
      <path d={`M${x - 7} 20a8 8 0 0 1 4-4.6`} fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="1.2" strokeLinecap="round" />
    </g>)}
    <rect x="21" y="13" width="6" height="3" rx="1.5" fill="#c4c8ce" />
  </>,
  "dc-motor": <>
    <path d="M8 19c-4 0-6 6-5 26" fill="none" stroke="#c9352f" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 29c-2.5 0-3.5 6-2 16" fill="none" stroke="#26262a" strokeWidth="2" strokeLinecap="round" />
    <rect x="7" y="12" width="28" height="24" rx="4" fill="#c4c8ce" />
    <rect x="7" y="12" width="4" height="24" rx="2" fill="#8d9198" />
    <rect x="32" y="13" width="4" height="22" rx="2" fill="#8d9198" />
    <rect x="36" y="20" width="3" height="8" fill="#c9a24a" />
    <rect x="39" y="22.8" width="7" height="2.4" rx="1" fill="#c4c8ce" />
    <rect x="11" y="15" width="21" height="3" rx="1.5" fill="#fff" opacity=".55" />
  </>,
  "active-buzzer": <>
    {leg("M20 36v10")}
    {leg("M28 36v8")}
    <rect x="10" y="12" width="28" height="25" rx="3" fill="#2b2b2f" />
    <ellipse cx="24" cy="12" rx="14" ry="4" fill="#3d3e43" />
    <ellipse cx="24" cy="12" rx="3" ry="1.1" fill="#0d0d0f" />
    <path d="M14 10.5h3m-1.5-1.5v3" stroke="#e8e8e8" strokeWidth=".9" />
    <rect x="12.5" y="16" width="2" height="18" rx="1" fill={SHINE} opacity=".3" />
  </>,
  transistor: <>
    {[18, 24, 30].map(x => <g key={x}>{leg(`M${x} 27v19`, STEEL, 1.5)}</g>)}
    <path d="M14 28V13q0-6 6-6h8q6 0 6 6v15z" fill="#26262a" />
    <path d="M18 15h12m-12 4h12m-12 4h8" stroke="#e8e8e8" strokeOpacity=".55" strokeWidth="1" />
    <rect x="16" y="9" width="2" height="16" rx="1" fill={SHINE} opacity=".35" />
  </>,
  "arduino-uno-r3": <>
    <rect x="6" y="6" width="36" height="36" rx="3" fill="#2f62a6" />
    <rect x="17" y="16" width="14" height="16" rx="1" fill="#26262a" />
    <path d="M11 39h26" stroke="#e8e8e8" strokeOpacity=".6" strokeWidth="1.5" strokeDasharray="2 2" />
  </>,
  "esp32-devkit-v1": <>
    <rect x="14" y="4" width="20" height="40" rx="3" fill="#2f62a6" />
    <rect x="17" y="6" width="14" height="10" rx="1" fill="#c9ced6" />
    <path d="M11 8v36m26-36v36" stroke="#e8e8e8" strokeOpacity=".6" strokeWidth="1.5" strokeDasharray="2 2" />
  </>,
};

export function PartPicture({ kind }: { kind: string }) {
  return <svg className="part-picture" viewBox="0 0 48 48" aria-hidden="true">{PICTURES[kind]}</svg>;
}

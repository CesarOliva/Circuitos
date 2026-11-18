# Biblioteca de componentes electrónicos (POO + TypeScript)

Diez componentes con parámetros físicos, validación de valores y terminales.
**No incluye** conexiones, análisis eléctrico, estados derivados de corriente, Arduino ni UI.

## Ejecutar

```bash
npm install
npm run typecheck
npm run build
node dist/example.js
```

## Unidades

- Voltaje: V; corriente: A; resistencia: Ω; potencia: W
- Capacitancia: F; inductancia: H; iluminancia: lux; velocidad: RPM

## Diseño

- `ElectronicComponent` exige `type`, `getProperties()` y terminales identificables.
- Especificaciones nominales no equivalen a condiciones reales del circuito.
- `Switch` y `PushButton` exponen estados mecánicos; no resuelven voltajes.
- `LDR` utiliza una ley de potencia **aproximada y configurable**, no un modelo de un fabricante concreto.
- `Potentiometer` usa una pista ideal lineal sin resistencia de contacto.
- `Transistor` modela solo BJT (NPN/PNP) y parámetros nominales, no MOSFET.
- `DCVoltageSource` es ideal; `maxCurrent` es metadato para una futura protección.
- Infinito como valor predeterminado de `maxCurrent` no se puede serializar directamente a JSON.

Todos los componentes están exportados desde `src/index.ts`.
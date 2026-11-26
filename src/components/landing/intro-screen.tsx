"use client";

import { useEffect, useState } from "react";

// Vive en el módulo: se reinicia al recargar la página, pero sobrevive a la navegación del lado del cliente.
let played = false;

// Bienvenida a pantalla completa: tres órbitas en 3D alrededor de un LED que pulsa, y después el nombre de la marca (ver landing.css).
// Solo sale en la primera carga; al volver a Inicio desde el menú ya no se repite.
export function IntroScreen() {
  const [show] = useState(() => !played);

  useEffect(() => {
    played = true;
  }, []);

  if (!show) return null;

  return (
    <div className="intro-screen" aria-hidden="true">
      <div className="intro-scene">
        <div className="intro-orbits">
          <span className="orbit orbit-1" />
          <span className="orbit orbit-2" />
          <span className="orbit orbit-3" />
          <span className="intro-core" />
        </div>
        <p className="intro-brand">Circuitos</p>
      </div>
    </div>
  );
}

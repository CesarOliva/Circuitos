// Bienvenida a pantalla completa: tres órbitas en 3D alrededor de un LED que pulsa, y después el nombre de la marca (ver landing.css).
export function IntroScreen() {
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

// Contrato entre la interfaz y el modelo de IA de segmentación.
// Las coordenadas de `box` van de 0 a 1 respecto al ancho y alto de la imagen.

export type CircuitComponent = {
  id: string;
  label: string;
  box: { x: number; y: number; width: number; height: number };
};

export type CircuitStep = {
  title: string;
  description: string;
};

export type CircuitAnalysis = {
  components: CircuitComponent[];
  steps: CircuitStep[];
};

// Aquí se conectará el modelo de IA. Mientras no exista, devuelve null
// para que la interfaz muestre que todavía no hay resultados.
export async function analyzeCircuit(image: File): Promise<CircuitAnalysis | null> {
  void image;
  return null;
}

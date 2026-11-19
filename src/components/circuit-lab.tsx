"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { analyzeCircuit, type CircuitAnalysis } from "@/lib/circuit-analysis";

const FLOW = ["Subir foto", "Segmentar circuito", "Pasos educativos", "Modelo 3D"];

export default function CircuitLab() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<CircuitAnalysis | null>(null);
  const [analyzed, setAnalyzed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setAnalysis(null);
    setAnalyzed(false);
  }

  async function handleAnalyze() {
    if (!file) return;

    setIsAnalyzing(true);
    try {
      setAnalysis(await analyzeCircuit(file));
      setAnalyzed(true);
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="flex w-full max-w-6xl flex-col gap-6">
      <ol className="flex flex-wrap gap-2 text-sm">
        {FLOW.map((step, index) => (
          <li
            key={step}
            className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
          >
            <span className="font-semibold">{index + 1}</span>
            {step}
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Foto del circuito
          </h2>

          <label className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 p-4 text-center text-zinc-500 hover:border-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-500">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileChange}
            />
            {previewUrl ? (
              <div className="relative w-full">
                {/* Se usa img normal porque la vista previa es una URL blob local. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Vista previa del circuito" className="w-full rounded-lg" />
                {analysis?.components.map((component) => (
                  <div
                    key={component.id}
                    className="absolute border-2 border-emerald-400 bg-emerald-400/10 text-xs text-emerald-200"
                    style={{
                      left: `${component.box.x * 100}%`,
                      top: `${component.box.y * 100}%`,
                      width: `${component.box.width * 100}%`,
                      height: `${component.box.height * 100}%`,
                    }}
                  >
                    <span className="bg-emerald-400 px-1 text-black">{component.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  Haz clic para elegir una foto
                </span>
                <span className="text-sm">JPG, PNG o WEBP</span>
              </>
            )}
          </label>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!file || isAnalyzing}
            className="h-11 rounded-full bg-zinc-900 px-5 font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {isAnalyzing ? "Analizando..." : "Analizar circuito"}
          </button>

          {analyzed && !analysis && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              El modelo de IA todavía no está conectado, así que no hay componentes que mostrar.
            </p>
          )}
        </section>

        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Pasos educativos
            </h2>
            {analysis && analysis.steps.length > 0 ? (
              <ol className="flex list-decimal flex-col gap-3 pl-5 text-zinc-700 dark:text-zinc-300">
                {analysis.steps.map((step) => (
                  <li key={step.title}>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">{step.title}</p>
                    <p className="text-sm">{step.description}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Aquí aparecerán los pasos para entender o armar el circuito cuando la IA lo reconozca.
              </p>
            )}
          </section>

          <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Modelo 3D
            </h2>
            <div className="flex h-48 items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 text-sm text-zinc-500 dark:border-zinc-700">
              Visor 3D pendiente
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

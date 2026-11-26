"use client";

import { useRef, useState } from "react";

type Component = {
  id: number;
  type: string;
  value: string | null;
  confidence: number;
  bbox: number[];
  mask_polygon: number[][];
};
type Result = { image: { width: number; height: number }; components: Component[] };

const COLORS: Record<string, string> = {
  resistor: "#e11d48",
  led: "#16a34a",
  capacitor: "#2563eb",
  wire: "#d97706",
  ic: "#7c3aed",
};

export default function Home() {
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File) {
    setResult(null);
    setBusy(true);
    setStatus("Subiendo imagen…");
    setPreview(URL.createObjectURL(file));
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/experiments/sam3/api/analyze", { method: "POST", body: form });
      if (!res.ok) throw new Error(`Error al subir la imagen (${res.status})`);
      const { job_id } = await res.json();
      setStatus("Analizando… puede tardar unos minutos");
      while (true) {
        await new Promise((r) => setTimeout(r, 3000));
        const r = await fetch(`/experiments/sam3/api/jobs/${job_id}`);
        if (!r.ok) {
          const body = await r.text();
          throw new Error(`Error consultando el análisis (${r.status}): ${body.slice(0, 200)}`);
        }
        const job = await r.json();
        if (job.status === "done") {
          setResult(job.result as Result);
          setStatus("");
          break;
        }
        if (job.status === "error") throw new Error(job.error);
      }
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setBusy(false);
    }
  }

  const counts: Record<string, number> = {};
  result?.components.forEach((c) => {
    counts[c.type] = (counts[c.type] ?? 0) + 1;
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#fff",
        color: "#111",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "48px 16px",
        gap: 24,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        style={{
          padding: "12px 24px",
          fontSize: 16,
          borderRadius: 8,
          border: "1px solid #111",
          background: busy ? "#eee" : "#111",
          color: busy ? "#888" : "#fff",
          cursor: busy ? "default" : "pointer",
        }}
      >
        {busy ? "Procesando…" : "Subir imagen"}
      </button>

      {status && <p style={{ margin: 0 }}>{status}</p>}

      {preview && (
        <div style={{ position: "relative", maxWidth: 900, width: "100%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Protoboard" style={{ width: "100%", display: "block" }} />
          {result && (
            <svg
              viewBox={`0 0 ${result.image.width} ${result.image.height}`}
              preserveAspectRatio="none"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            >
              {result.components.map((c) => {
                const color = COLORS[c.type] ?? "#000";
                const fs = result.image.width / 70;
                return (
                  <g key={c.id}>
                    <polygon
                      points={c.mask_polygon.map((p) => p.join(",")).join(" ")}
                      fill={color}
                      fillOpacity={0.35}
                      stroke={color}
                      strokeWidth={result.image.width / 600}
                    />
                    <text x={c.bbox[0]} y={c.bbox[1] - fs * 0.3} fontSize={fs} fill={color} fontWeight={700}>
                      {c.type} {c.confidence.toFixed(2)}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      )}

      {result && (
        <p style={{ margin: 0 }}>
          {result.components.length} componentes:{" "}
          {Object.entries(counts)
            .map(([t, n]) => `${n} ${t}`)
            .join(", ") || "ninguno"}
        </p>
      )}
    </main>
  );
}
"use client";

import * as React from "react";
import { useReadout } from "@/components/iso/react/live";

interface SpecimenProps {
  label: string;
  idle: string;
  // terminal id -> readout text, in the component's terminal order
  terminals: Array<{ id: string; text: string }>;
  children: React.ReactNode;
}

// Lights one terminal at a time (pad, trace, leads and block cell) and reads it out.
export function Specimen({ label, idle, terminals, children }: SpecimenProps) {
  const { anchor, say } = useReadout<HTMLDivElement>();
  const [lit, setLit] = React.useState<number | null>(null);

  React.useEffect(() => {
    const stage = anchor.current;
    if (!stage) return;
    const id = lit === null ? null : terminals[lit].id;
    for (const part of stage.querySelectorAll<SVGElement>("[data-terminal]")) {
      if (part.dataset.terminal === id) part.setAttribute("data-on", "");
      else part.removeAttribute("data-on");
    }
    say(lit === null ? idle : terminals[lit].text);
  }, [lit, terminals, idle, anchor, say]);

  const indexOf = (target: EventTarget) => {
    const part = (target as Element).closest?.("[data-terminal]") as SVGElement | null;
    if (!part) return null;
    const index = terminals.findIndex((terminal) => terminal.id === part.dataset.terminal);
    return index < 0 ? null : index;
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const count = terminals.length;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") setLit((current) => (current === null ? 0 : (current + 1) % count));
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") setLit((current) => (current === null ? count - 1 : (current + count - 1) % count));
    else if (event.key === "Escape") setLit(null);
    else return;
    event.preventDefault();
  };

  return (
    <div
      ref={anchor}
      className="iso-stage sim-stage"
      tabIndex={0}
      role="group"
      aria-label={label}
      onPointerOver={(event) => setLit(indexOf(event.target))}
      onPointerLeave={() => setLit(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setLit(null)}
    >
      {children}
    </div>
  );
}

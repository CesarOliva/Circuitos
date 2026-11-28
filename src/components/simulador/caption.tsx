import { formatProperty, type Spec } from "./catalog";
import { cueNotes, type Fault } from "./faults";

// Under each card: the class name followed by every technical property from getProperties().
// A failed part also says which failure it is, what the datasheet says it does, and what the drawing marks.
export function Caption({ spec, fault }: { spec: Spec; fault?: Fault }) {
  const notas = fault ? cueNotes(fault.cues, spec.terminals.map((terminal) => terminal.id)) : [];
  return (
    <>
      {fault ? (
        <span className="sim-fault">
          <strong>{fault.label}.</strong> {fault.symptom}{notas.length ? ` En el dibujo: ${notas.join("; ")}.` : ""}
        </span>
      ) : null}
      <span className="sim-class">
        <code>{spec.className}</code>
      </span>
      <dl className="sim-properties">
        {Object.entries(spec.properties).map(([key, value]) => (
          <div key={key}>
            <dt>{key}</dt>
            <dd>{formatProperty(key, value)}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

export const figureNumber = (index: number, spec: Spec) => `${String(index + 1).padStart(2, "0")} · ${spec.folder}`;

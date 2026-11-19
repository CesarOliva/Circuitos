import { formatProperty, type Spec } from "./catalog";

// Under each card: the class, its name and id, and every property from getProperties().
export function Caption({ spec }: { spec: Spec }) {
  return (
    <>
      <span className="sim-class">
        <code>{spec.className}</code> · {spec.name} · <code>{spec.id}</code> · <code>type: {spec.type}</code>
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

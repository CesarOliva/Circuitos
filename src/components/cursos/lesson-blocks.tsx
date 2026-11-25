import type { CSSProperties } from "react";
import type { LessonBlock } from "@/content";
import { Playground } from "./playgrounds";

export function LessonBlocks({ blocks }: { blocks: LessonBlock[] }) {
  return (
    <div className="lesson-body">
      {blocks.map((block, index) => {
        const style = { "--i": index } as CSSProperties;
        const key = `${block.type}-${index}`;

        switch (block.type) {
          case "paragraph":
            return <p key={key} style={style}>{block.text}</p>;
          case "list": {
            const List = block.ordered ? "ol" : "ul";
            return (
              <List key={key} className="lesson-list-block" style={style}>
                {block.items.map((item) => <li key={item}>{item}</li>)}
              </List>
            );
          }
          case "code":
            return (
              <pre key={key} className="lesson-code" style={style} data-language={block.language}>
                <code>{block.code}</code>
              </pre>
            );
          case "formula":
            return (
              <figure key={key} className="lesson-formula" style={style}>
                <code>{block.expression}</code>
                {block.caption && <figcaption>{block.caption}</figcaption>}
              </figure>
            );
          case "callout":
            return (
              <aside key={key} className="lesson-callout" data-tone={block.tone ?? "info"} style={style}>
                {block.title && <strong>{block.title}</strong>}
                <span>{block.text}</span>
              </aside>
            );
          case "playground":
            return <Playground key={key} kind={block.kind} />;
        }
      })}
    </div>
  );
}

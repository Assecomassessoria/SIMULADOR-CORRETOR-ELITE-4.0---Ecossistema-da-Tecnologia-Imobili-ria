import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({ startOnLoad: false, theme: "default", securityLevel: "loose" });

let _id = 0;
export default function MermaidBlock({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const id = `mmd-${++_id}-${Date.now()}`;
    mermaid
      .render(id, code.trim())
      .then(({ svg }) => {
        if (!cancelled && ref.current) ref.current.innerHTML = svg;
      })
      .catch((e) => !cancelled && setError(e?.message || "Erro ao renderizar diagrama"));
    return () => { cancelled = true; };
  }, [code]);

  if (error) {
    return (
      <pre className="bg-muted text-xs p-3 rounded-lg overflow-auto border border-destructive/30">
        <code>{code}</code>
        <div className="text-destructive mt-2">⚠ {error}</div>
      </pre>
    );
  }
  return <div ref={ref} className="my-2 overflow-x-auto bg-white p-3 rounded-lg border border-border" />;
}

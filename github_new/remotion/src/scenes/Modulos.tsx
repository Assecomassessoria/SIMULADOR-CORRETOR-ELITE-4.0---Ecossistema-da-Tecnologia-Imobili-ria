import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont as loadDisplay } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadBody } from "@remotion/google-fonts/Inter";
import { GOLD, NAVY_MID, WHITE, CREAM } from "../theme";

const display = loadDisplay("normal", { weights: ["700"] });
const body = loadBody("normal", { weights: ["400", "600", "700"] });

const modules = [
  { tag: "SIM", title: "Simulação 4.0", desc: "Caixa, MCMV, Pró-Soluto e relatórios completos" },
  { tag: "CRM", title: "CRM Elite", desc: "Kanban de leads, construtoras e tarefas" },
  { tag: "ADS", title: "Hub de Marketing", desc: "Gerador de anúncios com IA + Meta Ads" },
  { tag: "IA",  title: "Luiza Elite IA", desc: "Assistente especialista em CAIXA e vendas" },
  { tag: "DOC", title: "Documentos Caixa", desc: "Ficha MO e SICAQ automatizados" },
  { tag: "PPT", title: "Apresentação", desc: "Slides profissionais em PDF/PPTX" },
];

export const Modulos: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({ frame, fps, config: { damping: 18 } });
  return (
    <AbsoluteFill style={{ padding: "50px 100px", justifyContent: "center" }}>
      <div style={{ fontFamily: body.fontFamily, color: GOLD, fontSize: 16, letterSpacing: 5, marginBottom: 10, opacity: t }}>
        MUITO ALÉM DE UM SIMULADOR
      </div>
      <div style={{ fontFamily: display.fontFamily, color: WHITE, fontSize: 60, fontWeight: 700, marginBottom: 36, opacity: t }}>
        Plataforma integrada
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
        {modules.map((m, i) => {
          const s = spring({ frame: frame - (15 + i * 9), fps, config: { damping: 16, stiffness: 140 } });
          return (
            <div key={i} style={{
              background: `linear-gradient(180deg, ${NAVY_MID}, rgba(6,26,51,0.6))`,
              border: `1px solid rgba(212,175,82,0.5)`,
              borderRadius: 18,
              padding: 28,
              opacity: s,
              transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
              minHeight: 200,
            }}>
              <div style={{
                display: "inline-block",
                padding: "6px 14px",
                border: `1.5px solid ${GOLD}`,
                borderRadius: 999,
                color: GOLD,
                fontFamily: body.fontFamily,
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: 2,
                marginBottom: 18,
              }}>{m.tag}</div>
              <div style={{ fontFamily: display.fontFamily, color: GOLD, fontSize: 26, fontWeight: 700, marginBottom: 10 }}>
                {m.title}
              </div>
              <div style={{ fontFamily: body.fontFamily, color: CREAM, opacity: 0.8, fontSize: 17, lineHeight: 1.4 }}>
                {m.desc}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

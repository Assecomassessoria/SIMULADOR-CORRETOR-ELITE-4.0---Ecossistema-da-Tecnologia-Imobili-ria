import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont as loadDisplay } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadBody } from "@remotion/google-fonts/Inter";
import { GOLD, GOLD_SOFT, NAVY_MID, WHITE, CREAM, GREEN } from "../theme";

const display = loadDisplay("normal", { weights: ["700"] });
const body = loadBody("normal", { weights: ["400", "600", "700"] });

type Item = { label: string; value: string; detail: string };
const items: Item[] = [
  { label: "Fase de obra", value: "20%", detail: "Pago durante a construção" },
  { label: "Intermediária", value: "R$ 15.000,00", detail: "Reforço único" },
  { label: "Parcelas das chaves", value: "4 × R$ 20.000,00", detail: "Na entrega" },
  { label: "Saldo pós-chaves", value: "36 meses", detail: "Parcelado após entrega" },
];

export const Fluxo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({ frame, fps, config: { damping: 18 } });

  return (
    <AbsoluteFill style={{ padding: "60px 100px", justifyContent: "center" }}>
      <div style={{ fontFamily: body.fontFamily, color: GOLD, fontSize: 16, letterSpacing: 5, marginBottom: 10, opacity: t }}>
        FLUXO DE PAGAMENTO ESTRUTURADO
      </div>
      <div style={{ fontFamily: display.fontFamily, color: WHITE, fontSize: 60, fontWeight: 700, marginBottom: 40, opacity: t }}>
        Composição da entrada
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
        {items.map((it, i) => {
          const s = spring({ frame: frame - (18 + i * 14), fps, config: { damping: 18 } });
          return (
            <div key={i} style={{
              background: `linear-gradient(135deg, ${NAVY_MID}, rgba(6,26,51,0.7))`,
              border: `1px solid ${GOLD}`,
              borderRadius: 18,
              padding: "32px 36px",
              opacity: s,
              transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px) scale(${interpolate(s, [0, 1], [0.95, 1])})`,
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 18, right: 24,
                fontFamily: display.fontFamily, color: GOLD_SOFT, opacity: 0.25, fontSize: 80, fontWeight: 700,
              }}>0{i + 1}</div>
              <div style={{ fontFamily: body.fontFamily, color: GOLD, fontSize: 13, letterSpacing: 2.5, marginBottom: 14 }}>
                {it.label.toUpperCase()}
              </div>
              <div style={{ fontFamily: display.fontFamily, color: WHITE, fontSize: 48, fontWeight: 700, lineHeight: 1 }}>
                {it.value}
              </div>
              <div style={{ fontFamily: body.fontFamily, color: CREAM, opacity: 0.7, fontSize: 17, marginTop: 14 }}>
                {it.detail}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom summary bar */}
      {(() => {
        const s = spring({ frame: frame - 110, fps, config: { damping: 18 } });
        return (
          <div style={{
            marginTop: 28,
            background: GREEN,
            borderRadius: 14,
            padding: "20px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            opacity: s,
            transform: `scaleX(${interpolate(s, [0, 1], [0.5, 1])})`,
          }}>
            <span style={{ fontFamily: body.fontFamily, color: "#0a2a4f", fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>
              SIMULAÇÃO COMPLETA GERADA
            </span>
            <span style={{ fontFamily: body.fontFamily, color: "#0a2a4f", fontSize: 18, fontWeight: 600 }}>
              Pronta para impressão e envio ao cliente
            </span>
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};

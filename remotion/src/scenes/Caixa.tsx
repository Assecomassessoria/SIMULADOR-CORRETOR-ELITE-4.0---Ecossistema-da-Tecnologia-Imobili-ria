import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont as loadDisplay } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadBody } from "@remotion/google-fonts/Inter";
import { GOLD, NAVY_MID, WHITE, CREAM } from "../theme";

const display = loadDisplay("normal", { weights: ["700"] });
const body = loadBody("normal", { weights: ["400", "600", "700"] });

export const Caixa: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({ frame, fps, config: { damping: 18 } });
  const c1 = spring({ frame: frame - 18, fps, config: { damping: 16 } });
  const c2 = spring({ frame: frame - 36, fps, config: { damping: 16 } });
  // Animate values
  const aprov = Math.round(interpolate(frame, [18, 55], [0, 310000], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const parc = interpolate(frame, [36, 72], [0, 3457], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ padding: "60px 120px", justifyContent: "center" }}>
      <div style={{
        fontFamily: body.fontFamily, color: GOLD, fontSize: 16, letterSpacing: 5, marginBottom: 10, opacity: t,
      }}>
        APROVAÇÃO DE FINANCIAMENTO
      </div>
      <div style={{
        fontFamily: display.fontFamily, color: WHITE, fontSize: 64, fontWeight: 700, marginBottom: 40, opacity: t,
      }}>
        Caixa Econômica Federal
      </div>

      <div style={{ display: "flex", gap: 32 }}>
        <Card
          label="Valor aprovado"
          value={`R$ ${aprov.toLocaleString("pt-BR")},00`}
          sub="Limite financiado pela Caixa"
          opacity={c1}
        />
        <Card
          label="Parcela mensal"
          value={`R$ ${parc.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub="Comprometimento de renda dentro do limite"
          opacity={c2}
          gold
        />
      </div>
    </AbsoluteFill>
  );
};

const Card: React.FC<{ label: string; value: string; sub: string; opacity: number; gold?: boolean }> = ({ label, value, sub, opacity, gold }) => (
  <div style={{
    flex: 1,
    background: `linear-gradient(180deg, ${NAVY_MID}, rgba(10,42,79,0.6))`,
    border: `2px solid ${gold ? GOLD : "rgba(212,175,82,0.35)"}`,
    borderRadius: 20,
    padding: 40,
    opacity,
    transform: `translateY(${interpolate(opacity, [0, 1], [40, 0])}px)`,
    boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
  }}>
    <div style={{ fontFamily: body.fontFamily, color: GOLD, fontSize: 14, letterSpacing: 3, marginBottom: 16 }}>{label.toUpperCase()}</div>
    <div style={{ fontFamily: display.fontFamily, color: gold ? GOLD : WHITE, fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
    <div style={{ fontFamily: body.fontFamily, color: CREAM, opacity: 0.7, fontSize: 18, marginTop: 18 }}>{sub}</div>
  </div>
);

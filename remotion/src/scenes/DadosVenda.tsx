import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence } from "remotion";
import { loadFont as loadDisplay } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadBody } from "@remotion/google-fonts/Inter";
import { GOLD, NAVY, NAVY_MID, WHITE, CREAM, GREEN } from "../theme";

const display = loadDisplay("normal", { weights: ["700"] });
const body = loadBody("normal", { weights: ["400", "600", "700"] });

const Row: React.FC<{ label: string; value: string; delay: number; accent?: string }> = ({ label, value, delay, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 20 } });
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "rgba(0,0,0,0.22)",
      border: `1px solid ${accent ?? "rgba(212,175,82,0.25)"}`,
      borderRadius: 12,
      padding: "18px 24px",
      marginBottom: 14,
      opacity: s,
      transform: `translateX(${interpolate(s, [0, 1], [40, 0])}px)`,
    }}>
      <span style={{ fontFamily: body.fontFamily, color: CREAM, fontSize: 22, fontWeight: 400 }}>{label}</span>
      <span style={{ fontFamily: body.fontFamily, color: accent ?? WHITE, fontSize: 28, fontWeight: 700 }}>{value}</span>
    </div>
  );
};

export const DadosVenda: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleS = spring({ frame, fps, config: { damping: 18 } });
  return (
    <AbsoluteFill style={{ padding: "60px 120px", justifyContent: "center" }}>
      <div style={{
        fontFamily: body.fontFamily,
        color: GOLD,
        fontSize: 16,
        letterSpacing: 5,
        marginBottom: 10,
        opacity: titleS,
      }}>
        SIMULAÇÃO 4.0  •  DADOS DA VENDA
      </div>
      <div style={{
        fontFamily: display.fontFamily,
        color: WHITE,
        fontSize: 64,
        fontWeight: 700,
        marginBottom: 36,
        opacity: titleS,
        transform: `translateY(${interpolate(titleS, [0, 1], [20, 0])}px)`,
      }}>
        Valores do imóvel
      </div>

      <div style={{ maxWidth: 1100 }}>
        <Row label="Valor de lançamento" value="R$ 500.000,00" delay={15} />
        <Row label="Valor de venda" value="R$ 456.000,00" delay={30} accent={GOLD} />
        <Row label="Desconto concedido" value="R$ 25.000,00" delay={45} accent={GREEN} />
      </div>
    </AbsoluteFill>
  );
};

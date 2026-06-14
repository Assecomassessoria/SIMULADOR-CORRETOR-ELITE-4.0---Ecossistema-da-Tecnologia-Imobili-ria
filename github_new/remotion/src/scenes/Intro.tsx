import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont as loadDisplay } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadBody } from "@remotion/google-fonts/Inter";
import { GOLD, GOLD_SOFT, CREAM, WHITE } from "../theme";

const display = loadDisplay("normal", { weights: ["700", "900"] });
const body = loadBody("normal", { weights: ["400", "600", "700"] });

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s1 = spring({ frame, fps, config: { damping: 18, stiffness: 120 } });
  const s2 = spring({ frame: frame - 18, fps, config: { damping: 18 } });
  const s3 = spring({ frame: frame - 36, fps, config: { damping: 20 } });
  const lineW = interpolate(s2, [0, 1], [0, 520]);
  const exit = interpolate(frame, [70, 90], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: exit }}>
      <div style={{
        fontFamily: body.fontFamily,
        color: GOLD,
        letterSpacing: 8,
        fontSize: 22,
        fontWeight: 600,
        opacity: s1,
        transform: `translateY(${interpolate(s1, [0, 1], [20, 0])}px)`,
        marginBottom: 24,
      }}>
        ELITE  •  CORRETOR  •  4.0
      </div>
      <div style={{
        fontFamily: display.fontFamily,
        color: WHITE,
        fontSize: 130,
        fontWeight: 900,
        lineHeight: 1,
        opacity: s2,
        transform: `scale(${interpolate(s2, [0, 1], [0.85, 1])})`,
        textAlign: "center",
      }}>
        Simulador
      </div>
      <div style={{
        height: 3,
        width: lineW,
        background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
        margin: "28px 0",
      }} />
      <div style={{
        fontFamily: body.fontFamily,
        color: CREAM,
        fontSize: 28,
        fontWeight: 400,
        opacity: s3,
        letterSpacing: 2,
      }}>
        a plataforma completa do corretor de imóveis
      </div>
    </AbsoluteFill>
  );
};

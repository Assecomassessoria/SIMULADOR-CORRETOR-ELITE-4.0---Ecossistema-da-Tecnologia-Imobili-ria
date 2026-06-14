import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont as loadDisplay } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadBody } from "@remotion/google-fonts/Inter";
import { GOLD, WHITE, CREAM } from "../theme";

const display = loadDisplay("normal", { weights: ["700", "900"] });
const body = loadBody("normal", { weights: ["400", "600"] });

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s1 = spring({ frame, fps, config: { damping: 18 } });
  const s2 = spring({ frame: frame - 18, fps, config: { damping: 20 } });
  const s3 = spring({ frame: frame - 38, fps, config: { damping: 22 } });
  const lineW = interpolate(s2, [0, 1], [0, 600]);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{
        fontFamily: display.fontFamily, color: WHITE, fontSize: 110, fontWeight: 900,
        opacity: s1, transform: `scale(${interpolate(s1, [0, 1], [0.9, 1])})`, textAlign: "center", lineHeight: 1,
      }}>
        Corretor Elite
      </div>
      <div style={{ height: 3, width: lineW, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`, margin: "26px 0" }} />
      <div style={{
        fontFamily: body.fontFamily, color: CREAM, fontSize: 26, opacity: s3, letterSpacing: 2, textAlign: "center", maxWidth: 1100,
      }}>
        Tecnologia, inteligência e organização para o corretor de imóveis moderno.
      </div>
      <div style={{
        marginTop: 50,
        fontFamily: body.fontFamily, color: GOLD, fontSize: 18, letterSpacing: 6, opacity: s3,
      }}>
        SIMULADORCORRETORELITE.COM.BR
      </div>
    </AbsoluteFill>
  );
};

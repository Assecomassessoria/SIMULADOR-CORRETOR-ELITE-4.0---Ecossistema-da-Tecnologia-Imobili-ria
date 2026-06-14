import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont as loadDisplay } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadBody } from "@remotion/google-fonts/Inter";
import { GOLD, NAVY, NAVY_MID, WHITE, CREAM, GREEN } from "../theme";

const display = loadDisplay("normal", { weights: ["700"] });
const body = loadBody("normal", { weights: ["400", "600", "700"] });

export const Login: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const card = spring({ frame, fps, config: { damping: 18 } });
  const typed = Math.min(9, Math.floor(interpolate(frame, [20, 50], [0, 9], { extrapolateRight: "clamp" })));
  const password = "303600358".slice(0, typed);
  const showCheck = frame > 65;
  const checkS = spring({ frame: frame - 65, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{
        fontFamily: body.fontFamily,
        color: GOLD,
        fontSize: 18,
        letterSpacing: 6,
        marginBottom: 18,
        opacity: card,
      }}>
        ACESSO AUTORIZADO
      </div>
      <div style={{
        width: 720,
        background: `linear-gradient(180deg, ${NAVY_MID}, ${NAVY})`,
        border: `2px solid ${GOLD}`,
        borderRadius: 20,
        padding: 48,
        boxShadow: "0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
        opacity: card,
        transform: `translateY(${interpolate(card, [0, 1], [40, 0])}px)`,
      }}>
        <div style={{ fontFamily: display.fontFamily, color: WHITE, fontSize: 42, fontWeight: 700, textAlign: "center", marginBottom: 6 }}>
          Entrar no sistema
        </div>
        <div style={{ fontFamily: body.fontFamily, color: CREAM, opacity: 0.7, textAlign: "center", marginBottom: 32, fontSize: 16 }}>
          Senha Master — Corretor Elite
        </div>

        <div style={{ fontFamily: body.fontFamily, color: GOLD, fontSize: 13, letterSpacing: 1.5, marginBottom: 8 }}>E-MAIL</div>
        <div style={{
          background: "rgba(0,0,0,0.25)",
          border: "1px solid rgba(212,175,82,0.3)",
          borderRadius: 10,
          padding: "16px 20px",
          color: WHITE,
          fontFamily: body.fontFamily,
          fontSize: 20,
          marginBottom: 20,
        }}>
          lourencojrluiz70@gmail.com
        </div>

        <div style={{ fontFamily: body.fontFamily, color: GOLD, fontSize: 13, letterSpacing: 1.5, marginBottom: 8 }}>SENHA MASTER</div>
        <div style={{
          background: "rgba(0,0,0,0.25)",
          border: `1px solid ${frame > 50 ? GOLD : "rgba(212,175,82,0.3)"}`,
          borderRadius: 10,
          padding: "16px 20px",
          color: WHITE,
          fontFamily: body.fontFamily,
          fontSize: 26,
          letterSpacing: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "none",
        }}>
          <span>{password}<span style={{ opacity: frame % 20 < 10 ? 1 : 0 }}>|</span></span>
          {showCheck && (
            <span style={{
              color: GREEN,
              fontSize: 28,
              transform: `scale(${checkS})`,
            }}>✓</span>
          )}
        </div>

        <div style={{
          marginTop: 28,
          background: showCheck ? GREEN : GOLD,
          color: NAVY,
          fontFamily: body.fontFamily,
          fontWeight: 700,
          textAlign: "center",
          padding: "16px",
          borderRadius: 10,
          fontSize: 18,
          letterSpacing: 1,
        }}>
          {showCheck ? "SISTEMA LIBERADO — ACESSO TOTAL" : "ENTRAR"}
        </div>
      </div>
    </AbsoluteFill>
  );
};

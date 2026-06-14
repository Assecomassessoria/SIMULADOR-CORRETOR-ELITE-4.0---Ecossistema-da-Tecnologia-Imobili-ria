import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { TransitionSeries, linearTiming, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { slide } from "@remotion/transitions/slide";
import { NAVY_DEEP, GOLD } from "./theme";
import { Intro } from "./scenes/Intro";
import { Login } from "./scenes/Login";
import { DadosVenda } from "./scenes/DadosVenda";
import { Caixa } from "./scenes/Caixa";
import { Fluxo } from "./scenes/Fluxo";
import { Modulos } from "./scenes/Modulos";
import { Outro } from "./scenes/Outro";

const D = {
  intro: 90,
  login: 90,
  venda: 135,
  caixa: 105,
  fluxo: 165,
  modulos: 135,
  outro: 105,
};
const T = 18;
export const TOTAL_FRAMES =
  D.intro + D.login + D.venda + D.caixa + D.fluxo + D.modulos + D.outro - T * 6;

const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: NAVY_DEEP, overflow: "hidden" }}>
      {/* Soft radial */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 30% 20%, rgba(212,175,82,0.18), transparent 55%), radial-gradient(ellipse at 75% 85%, rgba(16,62,110,0.6), transparent 60%)`,
        }}
      />
      {/* Floating gold orbs */}
      {[...Array(6)].map((_, i) => {
        const seed = i * 137;
        const x = (seed % width);
        const y = ((seed * 73) % height);
        const drift = Math.sin((frame + i * 40) / 60) * 40;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y + drift,
              width: 6 + (i % 3) * 4,
              height: 6 + (i % 3) * 4,
              borderRadius: "50%",
              background: GOLD,
              opacity: 0.15 + (i % 3) * 0.08,
              filter: "blur(1px)",
            }}
          />
        );
      })}
      {/* Subtle grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(212,175,82,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,82,0.04) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />
    </AbsoluteFill>
  );
};

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Backdrop />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={D.intro}>
          <Intro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={D.login}>
          <Login />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={D.venda}>
          <DadosVenda />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={D.caixa}>
          <Caixa />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={D.fluxo}>
          <Fluxo />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-bottom" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={D.modulos}>
          <Modulos />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={D.outro}>
          <Outro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

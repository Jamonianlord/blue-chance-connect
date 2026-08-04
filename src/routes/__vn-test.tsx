import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/__vn-test")({ component: Harness });

// Mirror of VoiceNoteBubble's playback UI (temporary visual test harness).
function Harness() {
  const [renders, setRenders] = useState(0);
  return (
    <div className="p-8">
      <Bubble onRender={() => setRenders((r) => r)} />
      <div id="render-count" data-count={renders} />
    </div>
  );
}

let renderCount = 0;

function Bubble({ onRender }: { onRender: () => void }) {
  renderCount++;
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number | null>(null);
  const durationSeconds = 6;

  const bars = useMemo(() => {
    const seed = 12345;
    return Array.from({ length: 24 }, (_, i) => ((seed * (i + 1) * 7) % 100) / 100);
  }, []);

  useEffect(() => {
    if (playing) audioRef.current?.play().catch(() => setPlaying(false));
    else audioRef.current?.pause();
  }, [playing]);

  useEffect(() => {
    const paint = (ratio: number, remaining: number) => {
      const width = trackRef.current?.clientWidth ?? 0;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${ratio * width}px, 0, 0)`;
        cursorRef.current.style.opacity = playing ? "1" : "0";
      }
      if (timeRef.current) timeRef.current.textContent = remaining.toFixed(1);
    };
    if (!playing) { paint(0, durationSeconds); return; }
    const tick = () => {
      const a = audioRef.current;
      if (a) {
        const total = durationSeconds;
        const ratio = Math.min(1, a.currentTime / total);
        paint(ratio, Math.max(0, total - a.currentTime));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [playing]);

  useEffect(() => { onRender(); });

  return (
    <div id="bubble" className="flex w-[320px] items-center gap-2 rounded-2xl bg-[var(--brand)] px-3 py-2">
      <audio ref={audioRef} src="/vn-test.wav" />
      <button id="play" onClick={() => setPlaying((p) => !p)} className="h-8 w-8 rounded-full bg-white/20 text-white">
        {playing ? "II" : "|>"}
      </button>
      <div ref={trackRef} className="relative flex h-6 flex-1 items-center gap-[2px] overflow-hidden">
        {bars.map((h, i) => (
          <div key={i} className="w-[2px] rounded-full" style={{ height: `${Math.max(4, h * 100)}%`, backgroundColor: "rgba(255,255,255,0.7)", transform: `scaleY(${0.3 + h * 0.7})`, opacity: 0.5 + h * 0.5 }} />
        ))}
        <div ref={cursorRef} className="pointer-events-none absolute bottom-0 left-0 top-0 w-[2px] rounded-full bg-white opacity-0 will-change-transform" />
      </div>
      <span ref={timeRef} id="time" className="min-w-[50px] text-right text-xs tabular-nums text-white/70">6.0</span>
      <span id="rc" data-renders={renderCount} className="hidden" />
    </div>
  );
}

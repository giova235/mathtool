"use client";
import React from "react";

export type EquationParams =
  | { type: "ellisse";      h: number; k: number; a: number; b: number }
  | { type: "iperbole";     h: number; k: number; a: number; b: number }
  | { type: "parabola";     h: number; k: number; a: number }
  | { type: "circonferenza"; h: number; k: number; r: number };

const W = 300, H = 300, M = 30;

function mkT(xMin: number, xMax: number, yMin: number, yMax: number) {
  const sx = (x: number) => M + ((x - xMin) / (xMax - xMin)) * (W - 2 * M);
  const sy = (y: number) => H - M - ((y - yMin) / (yMax - yMin)) * (H - 2 * M);
  return { sx, sy };
}

function ticks(min: number, max: number): number[] {
  const range = max - min;
  const rough = range / 5;
  const mag = Math.pow(10, Math.floor(Math.log10(Math.max(rough, 0.0001))));
  const step = ([1, 2, 5].map(s => s * mag).find(s => rough / s <= 1.5)) ?? mag;
  const out: number[] = [];
  const start = Math.ceil(min / step) * step;
  for (let t = start; t <= max + 1e-9; t += step) {
    out.push(Math.abs(t) < step * 1e-9 ? 0 : parseFloat(t.toPrecision(6)));
  }
  return out;
}

function fmt(n: number) {
  return n === Math.round(n) ? String(n) : n.toFixed(1);
}

interface PlotProps {
  xMin: number; xMax: number; yMin: number; yMax: number;
  curves: React.ReactNode;
  extras?: React.ReactNode;
  foci?: [number, number][];
  vertices?: [number, number][];
  centerLabel?: string;
}

function Plot({ xMin, xMax, yMin, yMax, curves, extras, foci = [], vertices = [], centerLabel }: PlotProps) {
  const { sx, sy } = mkT(xMin, xMax, yMin, yMax);
  const xT = ticks(xMin, xMax);
  const yT = ticks(yMin, yMax);
  const axY = sy(0), axX = sx(0);
  const xVis = 0 >= yMin && 0 <= yMax;
  const yVis = 0 >= xMin && 0 <= xMax;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full rounded-xl overflow-hidden">
      <rect width={W} height={H} fill="#0b0b0b" />
      {/* grid */}
      {xT.map(t => <line key={`gx${t}`} x1={sx(t)} y1={M} x2={sx(t)} y2={H - M} stroke={t === 0 ? "#1c1c1c" : "#131313"} strokeWidth={1} />)}
      {yT.map(t => <line key={`gy${t}`} x1={M} y1={sy(t)} x2={W - M} y2={sy(t)} stroke={t === 0 ? "#1c1c1c" : "#131313"} strokeWidth={1} />)}
      {/* axes */}
      {xVis && <line x1={M} y1={axY} x2={W - M} y2={axY} stroke="#2a2a2a" strokeWidth={1.5} />}
      {yVis && <line x1={axX} y1={M} x2={axX} y2={H - M} stroke="#2a2a2a" strokeWidth={1.5} />}
      {/* tick labels */}
      {xT.filter(t => t !== 0).map(t => (
        <text key={`tx${t}`} x={sx(t)} y={xVis ? axY + 11 : H - M + 11} fill="#333" fontSize={7} textAnchor="middle">{fmt(t)}</text>
      ))}
      {yT.filter(t => t !== 0).map(t => (
        <text key={`ty${t}`} x={yVis ? axX - 4 : M - 4} y={sy(t) + 3} fill="#333" fontSize={7} textAnchor="end">{fmt(t)}</text>
      ))}
      {extras}
      {curves}
      {/* vertices */}
      {vertices.map(([x, y], i) => (
        <circle key={`v${i}`} cx={sx(x)} cy={sy(y)} r={3} fill="#475569" />
      ))}
      {/* foci */}
      {foci.map(([x, y], i) => (
        <g key={`f${i}`}>
          <circle cx={sx(x)} cy={sy(y)} r={3.5} fill="#6366f1" />
          <text x={sx(x) + 5} y={sy(y) - 4} fill="#818cf8" fontSize={8} fontFamily="Georgia, serif">
            {foci.length > 1 ? (i === 0 ? "F₁" : "F₂") : "F"}
          </text>
        </g>
      ))}
      {centerLabel && yVis && xVis && (
        <text x={axX + 4} y={axY - 4} fill="#383838" fontSize={7}>O</text>
      )}
    </svg>
  );
}

export function ProblemGraph({ equation }: { equation: EquationParams }) {
  switch (equation.type) {
    case "ellisse":      return <EllipseGraph      {...equation} />;
    case "iperbole":     return <HyperbolaGraph    {...equation} />;
    case "parabola":     return <ParabolaGraph     {...equation} />;
    case "circonferenza": return <CircleGraph      {...equation} />;
  }
}

function EllipseGraph({ h, k, a, b }: Extract<EquationParams, { type: "ellisse" }>) {
  const span = Math.max(a, b) * 2.8;
  const xMin = h - span / 2, xMax = h + span / 2;
  const yMin = k - span / 2, yMax = k + span / 2;
  const { sx, sy } = mkT(xMin, xMax, yMin, yMax);
  const cx = sx(h), cy = sy(k);
  const rx = Math.abs(sx(h + a) - sx(h));
  const ry = Math.abs(sy(k + b) - sy(k));
  const c = Math.sqrt(Math.max(0, a * a - b * b));
  return (
    <Plot xMin={xMin} xMax={xMax} yMin={yMin} yMax={yMax} centerLabel="O"
      curves={<ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="rgba(99,102,241,0.08)" stroke="#818cf8" strokeWidth={1.8} />}
      foci={c > 0.01 ? [[h - c, k], [h + c, k]] : []}
      vertices={[[h - a, k], [h + a, k], [h, k + b], [h, k - b]]}
    />
  );
}

function HyperbolaGraph({ h, k, a, b }: Extract<EquationParams, { type: "iperbole" }>) {
  const span = Math.max(a, b) * 4;
  const xMin = h - span / 2, xMax = h + span / 2;
  const yMin = k - span / 2, yMax = k + span / 2;
  const { sx, sy } = mkT(xMin, xMax, yMin, yMax);
  const c = Math.sqrt(a * a + b * b);

  const branch = (sign: 1 | -1) => {
    const pts: string[] = [];
    for (let t = -2; t <= 2; t += 0.04) {
      const x = h + sign * a * Math.cosh(t);
      const y = k + b * Math.sinh(t);
      if (x >= xMin && x <= xMax && y >= yMin && y <= yMax)
        pts.push(`${sx(x).toFixed(1)},${sy(y).toFixed(1)}`);
    }
    return pts.length > 1 ? "M " + pts.join(" L ") : "";
  };
  const r = branch(1), l = branch(-1);
  const slope = b / a;
  const ext = (xMax - xMin) / 2;

  return (
    <Plot xMin={xMin} xMax={xMax} yMin={yMin} yMax={yMax} centerLabel="O"
      extras={<>
        <line x1={sx(h - ext)} y1={sy(k - slope * ext)} x2={sx(h + ext)} y2={sy(k + slope * ext)} stroke="#222" strokeWidth={1} strokeDasharray="5 3" />
        <line x1={sx(h - ext)} y1={sy(k + slope * ext)} x2={sx(h + ext)} y2={sy(k - slope * ext)} stroke="#222" strokeWidth={1} strokeDasharray="5 3" />
      </>}
      curves={<>
        {r && <path d={r} fill="none" stroke="#818cf8" strokeWidth={1.8} />}
        {l && <path d={l} fill="none" stroke="#818cf8" strokeWidth={1.8} />}
      </>}
      foci={[[h + c, k], [h - c, k]]}
      vertices={[[h + a, k], [h - a, k]]}
    />
  );
}

function ParabolaGraph({ h, k, a }: Extract<EquationParams, { type: "parabola" }>) {
  const safeA = Math.abs(a) < 0.001 ? 0.001 : a;
  const xRange = Math.sqrt(Math.abs(3 / safeA)) * 1.3;
  const xMin = h - xRange, xMax = h + xRange;
  const yEdge = safeA * xRange * xRange + k;
  const yMin = Math.min(k, yEdge) - Math.abs(yEdge - k) * 0.08;
  const yMax = Math.max(k, yEdge) + Math.abs(yEdge - k) * 0.15;
  const { sx, sy } = mkT(xMin, xMax, yMin, yMax);

  const pts: string[] = [];
  for (let i = 0; i <= 80; i++) {
    const x = xMin + (xMax - xMin) * (i / 80);
    const y = safeA * (x - h) * (x - h) + k;
    pts.push(`${sx(x).toFixed(1)},${sy(y).toFixed(1)}`);
  }

  const p = 1 / (4 * safeA);
  const focusY = k + p;
  const dirY = k - p;
  const dirVisible = dirY >= yMin && dirY <= yMax;

  return (
    <Plot xMin={xMin} xMax={xMax} yMin={yMin} yMax={yMax} centerLabel="O"
      extras={dirVisible ? (
        <line x1={M} y1={sy(dirY)} x2={W - M} y2={sy(dirY)} stroke="#2e3748" strokeWidth={1} strokeDasharray="5 3" />
      ) : undefined}
      curves={<path d={"M " + pts.join(" L ")} fill="none" stroke="#818cf8" strokeWidth={1.8} />}
      foci={[[h, focusY]]}
      vertices={[[h, k]]}
    />
  );
}

function CircleGraph({ h, k, r }: Extract<EquationParams, { type: "circonferenza" }>) {
  const pad = r * 0.55;
  const xMin = h - r - pad, xMax = h + r + pad;
  const yMin = k - r - pad, yMax = k + r + pad;
  const { sx, sy } = mkT(xMin, xMax, yMin, yMax);
  const cx = sx(h), cy = sy(k);
  const sr = Math.abs(sx(h + r) - sx(h));
  return (
    <Plot xMin={xMin} xMax={xMax} yMin={yMin} yMax={yMax} centerLabel="O"
      curves={<>
        <circle cx={cx} cy={cy} r={sr} fill="rgba(99,102,241,0.08)" stroke="#818cf8" strokeWidth={1.8} />
        <line x1={cx} y1={cy} x2={cx + sr * 0.707} y2={cy - sr * 0.707} stroke="#818cf8" strokeWidth={1} strokeDasharray="4 3" />
      </>}
      foci={[[h, k]]}
    />
  );
}

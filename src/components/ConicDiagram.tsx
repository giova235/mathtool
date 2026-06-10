type Props = { topic: string };

export function ConicDiagram({ topic }: Props) {
  const diagrams: Record<string, JSX.Element> = {
    ellisse:      <Ellipse />,
    iperbole:     <Hyperbola />,
    parabola:     <Parabola />,
    circonferenza: <Circle_ />,
  };

  const diagram = diagrams[topic];
  if (!diagram) return null;

  return (
    <div className="mb-8 animate-fade-in">
      <div className="bg-neutral-900/60 backdrop-blur border border-neutral-800 rounded-2xl p-5">
        <div className="w-full max-w-sm mx-auto" style={{ aspectRatio: "11/6" }}>
          {diagram}
        </div>
      </div>
    </div>
  );
}

/* ── shared SVG style tokens ── */
const CURVE  = { stroke: "#818cf8", strokeWidth: 1.6, fill: "none" } as const;
const AUX    = { stroke: "#2e2e2e", strokeWidth: 1,   strokeDasharray: "4 3" } as const;
const FOCUS  = { r: 3.5, fill: "#6366f1" } as const;
const VERTEX = { r: 2.5, fill: "#4b5563" } as const;
const LABEL  = { fill: "#818cf8", fontSize: 9, fontFamily: "Georgia, serif" } as const;
const DIM    = { fill: "#4b5563", fontSize: 9, fontFamily: "Georgia, serif" } as const;

function Ellipse() {
  return (
    <svg viewBox="0 0 220 130" className="w-full h-full">
      {/* axes */}
      <line x1="16" y1="65" x2="204" y2="65" {...AUX} />
      <line x1="110" y1="10" x2="110" y2="120" {...AUX} />
      {/* body */}
      <ellipse cx="110" cy="65" rx="82" ry="46"
        fill="rgba(99,102,241,0.06)" stroke="#818cf8" strokeWidth={1.6} />
      {/* vertices */}
      <circle cx="28"  cy="65" {...VERTEX} />
      <circle cx="192" cy="65" {...VERTEX} />
      <circle cx="110" cy="19" {...VERTEX} />
      <circle cx="110" cy="111" {...VERTEX} />
      {/* foci  c ≈ 68 */}
      <circle cx="42"  cy="65" {...FOCUS} />
      <circle cx="178" cy="65" {...FOCUS} />
      {/* labels */}
      <text x="36" y="80" {...LABEL}>F₁</text>
      <text x="173" y="80" {...LABEL}>F₂</text>
      <text x="196" y="69" {...DIM}>a</text>
      <text x="113" y="17" {...DIM}>b</text>
    </svg>
  );
}

function Hyperbola() {
  return (
    <svg viewBox="0 0 220 130" className="w-full h-full">
      {/* asymptotes  slope ≈ ±0.72 */}
      <line x1="18"  y1="0"   x2="202" y2="130" {...AUX} />
      <line x1="202" y1="0"   x2="18"  y2="130" {...AUX} />
      {/* centre axis */}
      <line x1="10" y1="65" x2="210" y2="65" {...AUX} />
      {/* left branch */}
      <path d="M 5,12 C 36,12 65,38 65,65 C 65,92 36,118 5,118" {...CURVE} />
      {/* right branch */}
      <path d="M 215,12 C 184,12 155,38 155,65 C 155,92 184,118 215,118" {...CURVE} />
      {/* foci */}
      <circle cx="38"  cy="65" {...FOCUS} />
      <circle cx="182" cy="65" {...FOCUS} />
      {/* vertices */}
      <circle cx="65"  cy="65" {...VERTEX} />
      <circle cx="155" cy="65" {...VERTEX} />
      {/* centre */}
      <circle cx="110" cy="65" r={2} fill="#2e3748" stroke="#4b5563" strokeWidth={1} />
      {/* labels */}
      <text x="30"  y="80" {...LABEL}>F₁</text>
      <text x="178" y="80" {...LABEL}>F₂</text>
      <text x="113" y="63" {...DIM}>O</text>
    </svg>
  );
}

function Parabola() {
  // vertex (110,108), focus (110,76), directrix y=140 (shown at 122 for visibility)
  return (
    <svg viewBox="0 0 220 130" className="w-full h-full">
      {/* axis of symmetry */}
      <line x1="110" y1="8" x2="110" y2="125" {...AUX} />
      {/* directrix */}
      <line x1="18" y1="122" x2="202" y2="122"
        stroke="#374151" strokeWidth={1} strokeDasharray="5 3" />
      <text x="148" y="119" {...DIM}>direttrice</text>
      {/* parabola — vertex at (110,105), arms to (20,22) and (200,22) */}
      <path d="M 20,22 C 20,103 110,108 110,108 C 110,108 200,103 200,22" {...CURVE} />
      {/* focus */}
      <circle cx="110" cy="76" {...FOCUS} />
      {/* vertex */}
      <circle cx="110" cy="108" {...VERTEX} />
      {/* labels */}
      <text x="115" y="74" {...LABEL}>F</text>
      <text x="115" y="112" {...DIM}>V</text>
    </svg>
  );
}

function Circle_() {
  // centre (110,65), r=50
  return (
    <svg viewBox="0 0 220 130" className="w-full h-full">
      {/* light crosshair */}
      <line x1="57" y1="65" x2="163" y2="65" {...AUX} />
      <line x1="110" y1="12" x2="110" y2="118" {...AUX} />
      {/* body */}
      <circle cx="110" cy="65" r="50"
        fill="rgba(99,102,241,0.06)" stroke="#818cf8" strokeWidth={1.6} />
      {/* radius line */}
      <line x1="110" y1="65" x2="145" y2="29"
        stroke="#818cf8" strokeWidth={1} strokeDasharray="4 3" />
      {/* centre */}
      <circle cx="110" cy="65" {...FOCUS} />
      {/* labels */}
      <text x="114" y="63" {...LABEL}>O</text>
      <text x="130" y="43" {...DIM}>r</text>
    </svg>
  );
}

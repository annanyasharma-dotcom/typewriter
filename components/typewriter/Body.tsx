import { memo } from "react";

/** Geometry of the typebar basket, shared with the striking-bar animation. */
export const BASKET = { cx: 520, cy: 528, rx: 150, ry: 84, count: 38 };

function basketBars() {
  const bars: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const { cx, cy, rx, ry, count } = BASKET;
  for (let i = 0; i < count; i++) {
    const a = ((8 + (164 * i) / (count - 1)) * Math.PI) / 180;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    bars.push({
      x1: cx + cos * (rx - 6),
      y1: cy + sin * (ry - 5),
      x2: cx + cos * rx * 0.36,
      y2: cy + sin * ry * 0.36,
    });
  }
  return bars;
}

const BARS = basketBars();

function Spool({ cx, cy }: { cx: number; cy: number }) {
  const rings = [40, 36, 32.5, 29, 25.5, 22];
  return (
    <g>
      <circle cx={cx} cy={cy + 3} r={50} fill="rgba(60,48,32,0.18)" filter="url(#tw-soft)" />
      <circle cx={cx} cy={cy} r={48} fill="url(#tw-chrome-ring)" />
      <circle cx={cx} cy={cy} r={44} fill="#2a2624" />
      {rings.map((r, i) => (
        <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={i % 2 ? "#353130" : "#3b3634"} strokeWidth={1.4} />
      ))}
      <circle cx={cx} cy={cy} r={44} fill="url(#tw-spool-sheen)" />
      <circle cx={cx} cy={cy} r={17} fill="url(#tw-chrome-hub)" />
      {[0, 120, 240].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return <circle key={deg} cx={cx + Math.cos(a) * 9} cy={cy + Math.sin(a) * 9} r={2.6} fill="#5d5853" />;
      })}
      <circle cx={cx} cy={cy} r={3} fill="#3c3835" />
    </g>
  );
}

/**
 * The machine's enamelled body: top deck with ribbon spools and the typebar
 * basket, the nameplate, and the stepped keyboard deck. Drawn once in SVG.
 */
export const Body = memo(function Body() {
  const { cx, cy, rx, ry } = BASKET;
  return (
    <svg className="tw-body" viewBox="0 500 1040 470" width={1040} height={470} aria-hidden="true">
      <defs>
        <filter id="tw-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id="tw-enamel-noise" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.3  0 0 0 0 0.25  0 0 0 0 0.2  0 0 0 0.09 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <linearGradient id="tw-deck-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e2dac9" />
          <stop offset="0.55" stopColor="#d5ccb9" />
          <stop offset="1" stopColor="#c8beaa" />
        </linearGradient>
        <linearGradient id="tw-deck-keys" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9bfab" />
          <stop offset="0.12" stopColor="#d6cdbb" />
          <stop offset="1" stopColor="#c3b9a4" />
        </linearGradient>
        <linearGradient id="tw-deck-side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.16" />
          <stop offset="0.08" stopColor="#000" stopOpacity="0" />
          <stop offset="0.92" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id="tw-band" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a69c88" />
          <stop offset="0.5" stopColor="#bdb39f" />
          <stop offset="1" stopColor="#968c79" />
        </linearGradient>
        <radialGradient id="tw-basket" cx="0.5" cy="0" r="1">
          <stop offset="0" stopColor="#0f0e0d" />
          <stop offset="0.7" stopColor="#24211f" />
          <stop offset="1" stopColor="#35312d" />
        </radialGradient>
        <radialGradient id="tw-chrome-ring" cx="0.4" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#f4f2ee" />
          <stop offset="0.45" stopColor="#b9b5ae" />
          <stop offset="0.8" stopColor="#8a857e" />
          <stop offset="1" stopColor="#cfcbc4" />
        </radialGradient>
        <radialGradient id="tw-chrome-hub" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#fbfaf7" />
          <stop offset="0.5" stopColor="#bdb8b0" />
          <stop offset="1" stopColor="#7f7a73" />
        </radialGradient>
        <radialGradient id="tw-spool-sheen" cx="0.35" cy="0.25" r="0.75">
          <stop offset="0" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="tw-badge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2c2a28" />
          <stop offset="1" stopColor="#151413" />
        </linearGradient>
        <linearGradient id="tw-badge-text" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3efe6" />
          <stop offset="1" stopColor="#a9a397" />
        </linearGradient>
        <linearGradient id="tw-capsule" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbf9f4" />
          <stop offset="1" stopColor="#e3ddd1" />
        </linearGradient>
      </defs>

      {/* Contact shadow on the desk */}
      <ellipse cx={520} cy={958} rx={500} ry={14} fill="rgba(70,55,35,0.28)" filter="url(#tw-soft)" />

      {/* Feet & base */}
      <rect x={70} y={940} width={900} height={14} rx={6} fill="#2a2725" />
      <rect x={96} y={948} width={56} height={10} rx={3} fill="#1c1a19" />
      <rect x={888} y={948} width={56} height={10} rx={3} fill="#1c1a19" />

      {/* Keyboard deck */}
      <path d="M 92 648 H 948 L 996 928 Q 998 946 980 946 H 60 Q 42 946 44 928 Z" fill="url(#tw-deck-keys)" />
      <path d="M 92 648 H 948 L 996 928 Q 998 946 980 946 H 60 Q 42 946 44 928 Z" fill="url(#tw-deck-side)" />
      <path d="M 92 648 H 948 L 996 928 Q 998 946 980 946 H 60 Q 42 946 44 928 Z" filter="url(#tw-enamel-noise)" fill="#fff" />
      <path d="M 60 945.5 H 980" stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
      {/* Keyboard well: the slot the key levers disappear into */}
      <path d="M 120 662 H 920 L 950 920 H 90 Z" fill="rgba(48,40,30,0.07)" />

      {/* Front band with the nameplate */}
      <path d="M 96 632 H 944 L 950 652 H 90 Z" fill="url(#tw-band)" />
      <path d="M 96 632.5 H 944" stroke="rgba(255,255,255,0.45)" strokeWidth={1} />

      {/* Top deck */}
      <path d="M 152 526 H 888 Q 926 526 934 560 L 944 632 H 96 L 106 560 Q 114 526 152 526 Z" fill="url(#tw-deck-top)" />
      <path d="M 152 526 H 888 Q 926 526 934 560 L 944 632 H 96 L 106 560 Q 114 526 152 526 Z" filter="url(#tw-enamel-noise)" fill="#fff" />
      <path d="M 152 526.6 H 888" stroke="rgba(255,255,255,0.7)" strokeWidth={1.2} />

      {/* Typebar basket */}
      <path d={`M ${cx - rx - 7} ${cy} A ${rx + 7} ${ry + 7} 0 0 0 ${cx + rx + 7} ${cy} Z`} fill="#b3a993" />
      <path d={`M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy} Z`} fill="url(#tw-basket)" />
      <g strokeLinecap="round">
        {BARS.map((b, i) => (
          <g key={i}>
            <line x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} stroke="#76716a" strokeWidth={2.2} opacity={0.85} />
            <line x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} stroke="#d8d3cb" strokeWidth={0.6} opacity={0.35} />
          </g>
        ))}
      </g>
      <path
        d={`M ${cx - 58} ${cy} A 58 32 0 0 0 ${cx + 58} ${cy}`}
        fill="#1a1817"
        stroke="#9e988f"
        strokeWidth={2}
      />
      <path d={`M ${cx - rx - 7} ${cy} A ${rx + 7} ${ry + 7} 0 0 0 ${cx + rx + 7} ${cy}`} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1} />

      <Spool cx={214} cy={580} />
      <Spool cx={826} cy={580} />

      {/* Nameplate — the machine's (invented) maker */}
      <rect x={462} y={636} width={116} height={14} rx={2} fill="url(#tw-badge)" />
      <text
        x={520}
        y={646.6}
        textAnchor="middle"
        fontSize={9.5}
        letterSpacing={5}
        fill="url(#tw-badge-text)"
        style={{ fontFamily: "var(--font-display)" }}
      >
        MARGIN
      </text>

      {/* Capsule — an homage to the reference; its dots report save status */}
      <g transform="translate(694 596)">
        <rect x={0} y={2} width={64} height={24} rx={12} fill="rgba(60,45,30,0.22)" filter="url(#tw-soft)" />
        <rect x={0} y={0} width={64} height={24} rx={12} fill="url(#tw-capsule)" stroke="rgba(120,105,85,0.35)" />
      </g>
    </svg>
  );
});

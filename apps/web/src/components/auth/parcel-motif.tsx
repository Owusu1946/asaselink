import * as React from "react";

export function ParcelMotif({ className }: { className?: string }) {
  return (
    <div
      className={className}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 400 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-w-sm drop-shadow-sm select-none"
      >
        {/* Boundary parcel boundary grid */}
        <path
          d="M20 40 L160 20 L240 60 L380 40 L370 280 L220 300 L140 260 L30 280 Z"
          stroke="rgba(255, 255, 255, 0.18)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Survey plots - clean cadastral lines */}
        {/* Plot 1 */}
        <polygon
          points="35,60 145,45 135,130 30,140"
          stroke="rgba(255, 255, 255, 0.22)"
          strokeWidth="1.2"
          fill="rgba(255, 255, 255, 0.03)"
        />
        <text x="75" y="98" fill="rgba(255, 255, 255, 0.4)" fontSize="10" fontFamily="monospace">
          P-039
        </text>

        {/* Plot 2 */}
        <polygon
          points="155,43 235,75 225,150 145,128"
          stroke="rgba(255, 255, 255, 0.22)"
          strokeWidth="1.2"
          fill="rgba(255, 255, 255, 0.03)"
        />
        <text x="175" y="105" fill="rgba(255, 255, 255, 0.4)" fontSize="10" fontFamily="monospace">
          P-040
        </text>

        {/* Plot 3 */}
        <polygon
          points="245,78 365,58 355,145 235,152"
          stroke="rgba(255, 255, 255, 0.22)"
          strokeWidth="1.2"
          fill="rgba(255, 255, 255, 0.03)"
        />
        <text x="290" y="108" fill="rgba(255, 255, 255, 0.4)" fontSize="10" fontFamily="monospace">
          P-041
        </text>

        {/* Plot 4 - ONE RESTRAINED GOLD SELECTION DETAIL */}
        <polygon
          points="145,138 230,160 215,250 130,225"
          stroke="#C79A24"
          strokeWidth="2"
          fill="rgba(199, 154, 36, 0.22)"
        />
        <circle cx="180" cy="192" r="3.5" fill="#C79A24" />
        <rect
          x="150"
          y="202"
          width="62"
          height="16"
          rx="8"
          fill="#C79A24"
        />
        <text
          x="181"
          y="213"
          fill="#061F17"
          fontSize="9"
          fontWeight="600"
          fontFamily="system-ui, sans-serif"
          textAnchor="middle"
        >
          Plot 42 · Title
        </text>

        {/* Plot 5 */}
        <polygon
          points="32,150 135,138 120,230 30,220"
          stroke="rgba(255, 255, 255, 0.22)"
          strokeWidth="1.2"
          fill="rgba(255, 255, 255, 0.03)"
        />
        <text x="68" y="188" fill="rgba(255, 255, 255, 0.4)" fontSize="10" fontFamily="monospace">
          P-043
        </text>

        {/* Plot 6 */}
        <polygon
          points="240,162 355,155 345,245 225,252"
          stroke="rgba(255, 255, 255, 0.22)"
          strokeWidth="1.2"
          fill="rgba(255, 255, 255, 0.03)"
        />
        <text x="280" y="208" fill="rgba(255, 255, 255, 0.4)" fontSize="10" fontFamily="monospace">
          P-044
        </text>
      </svg>
    </div>
  );
}

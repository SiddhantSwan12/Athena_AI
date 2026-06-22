// Custom minimal-line icon set for Athena.
// Designed to match the editorial aesthetic: 1.25–1.5px strokes,
// geometric, precise. Uses currentColor so it picks up the vertical accent.

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function FinanceIcon({ size = 16, className = "", style = {} }) {
  // Ascending sparkline with a marker dot at the peak
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className={className}
      style={style}
      aria-hidden="true"
      {...base}
    >
      <path d="M2 12 L5.5 8.5 L8 10 L13.5 3.5" />
      <circle cx="13.5" cy="3.5" r="1.2" fill="currentColor" stroke="none" />
      <path d="M2 14 H14" opacity="0.4" />
    </svg>
  );
}

export function HealthIcon({ size = 16, className = "", style = {} }) {
  // Heartbeat / ECG line — single clean trace
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className={className}
      style={style}
      aria-hidden="true"
      {...base}
    >
      <path d="M1.5 8 H4 L5.4 4.5 L7.6 12 L9.6 6 L11 8 H14.5" />
    </svg>
  );
}

export function EducationIcon({ size = 16, className = "", style = {} }) {
  // Open codex / book — two pages meeting at a spine
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className={className}
      style={style}
      aria-hidden="true"
      {...base}
    >
      <path d="M8 4.2 C5.6 3 3.6 3 2 3.4 V12.4 C3.6 12 5.6 12 8 13.2 C10.4 12 12.4 12 14 12.4 V3.4 C12.4 3 10.4 3 8 4.2 Z" />
      <path d="M8 4.2 V13.2" />
    </svg>
  );
}

// Owl mark — abstract two-eye glyph. Reads as 'owl' at any size,
// disappears into a tasteful logotype when small.
export function OwlIcon({ size = 16, className = "", style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      className={className}
      style={style}
      aria-hidden="true"
      {...base}
      strokeWidth={1.3}
    >
      {/* Eye rings */}
      <circle cx="7"  cy="10" r="3.2" />
      <circle cx="13" cy="10" r="3.2" />
      {/* Pupils */}
      <circle cx="7"  cy="10" r="0.85" fill="currentColor" stroke="none" />
      <circle cx="13" cy="10" r="0.85" fill="currentColor" stroke="none" />
      {/* Beak (small triangle between the eyes) */}
      <path d="M10 11.6 L9.1 13 L10.9 13 Z" fill="currentColor" stroke="none" />
      {/* Crown — minimal tufts hinting at feathered head */}
      <path d="M4 6.5 L5.5 7.6" />
      <path d="M16 6.5 L14.5 7.6" />
    </svg>
  );
}

// Wordmark — italic "A" glyph in Fraunces. Useful as a square favicon-sized brand.
export function AthenaMark({ size = 18, className = "", style = {} }) {
  return (
    <span
      className={className}
      style={{
        ...style,
        fontFamily: "Fraunces, serif",
        fontStyle: "italic",
        fontWeight: 600,
        fontSize: size,
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-hidden="true"
    >
      A
    </span>
  );
}

// Compass / Auto — for the "Auto" routing tab. A small reticle.
export function AutoIcon({ size = 16, className = "", style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className={className}
      style={style}
      aria-hidden="true"
      {...base}
    >
      <circle cx="8" cy="8" r="5.2" />
      <path d="M8 2.4 V4.8" />
      <path d="M8 11.2 V13.6" />
      <path d="M2.4 8 H4.8" />
      <path d="M11.2 8 H13.6" />
      <circle cx="8" cy="8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Map vertical id → icon component
export const VERTICAL_ICON = {
  finance:   FinanceIcon,
  health:    HealthIcon,
  education: EducationIcon,
};

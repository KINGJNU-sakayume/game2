import type { SVGProps } from "react";

/** Line icons drawn for this game: 24px grid, 1.6px stroke, round joins. */
const base = (props: SVGProps<SVGSVGElement>) => ({
  width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6,
  strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, focusable: false, ...props,
});

export const IconChart = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}><path d="M8.5 4.5h-2a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 6.5 20.5h11a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5h-2" /><rect x="8.5" y="3" width="7" height="3.2" rx="1" /><path d="M8.5 11h7M8.5 14.5h7M8.5 18h4" /></svg>
);
export const IconLog = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}><path d="M5 6.5h14M5 11.5h10M5 16.5h7" /><path d="M16.5 15.5v3l2 1.2" /></svg>
);
export const IconMenu = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}><path d="M5 8h14M9 13h10M13 18h6" /></svg>
);
export const IconClose = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" /></svg>
);
export const IconNext = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}><path d="M9.5 6l6 6-6 6" /></svg>
);
export const IconPin = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}><path d="M9 4h6l-1 5 3 3H7l3-3-1-5zM12 12v8" /></svg>
);
export const IconFlask = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}><path d="M9.5 3.5h5M10.5 3.5v5.2L5.6 17.4a2 2 0 0 0 1.7 3.1h9.4a2 2 0 0 0 1.7-3.1l-4.9-8.7V3.5" /><path d="M7.8 14h8.4" /></svg>
);
export const IconSwipe = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}><path d="M4 12h16M7.5 8.5L4 12l3.5 3.5M16.5 8.5L20 12l-3.5 3.5" /></svg>
);
export const IconLock = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}><rect x="5.5" y="10.5" width="13" height="9.5" rx="1.6" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></svg>
);
export const IconBack = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}><path d="M14.5 6l-6 6 6 6" /></svg>
);
export const IconAuto = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}><path d="M6 7l6 5-6 5V7zM13 7l6 5-6 5" /></svg>
);
/** The inspect ring used on photograph hotspots. */
export const IconInspect = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}><circle cx="11" cy="11" r="5.5" /><path d="M15.2 15.2L19 19" /></svg>
);

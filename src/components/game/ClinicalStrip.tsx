import type { ClinicalDatum } from "@/game/types";
export function ClinicalStrip({ data }: { data?: ClinicalDatum[] }) {
  if (!data?.length) return null;
  return <dl className="clinical-strip" aria-label="주요 임상 정보">{data.map(item => <div key={item.label} data-tone={item.tone}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>;
}

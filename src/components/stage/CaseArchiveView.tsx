import type { ArchiveDefinition, CaseArchive } from "@/game/types";

const words = {
  appropriate: "적절", late: "늦음", failed: "놓침", delayed: "지연",
  sufficient: "모두 확인", partial: "일부 확인", unknown: "확인 못 함",
  trusted: "신뢰", guarded: "조심스러움", broken: "단절",
} as const;
const tone = {
  appropriate: "good", late: "warn", failed: "bad", delayed: "warn",
  sufficient: "good", partial: "warn", unknown: "bad",
  trusted: "good", guarded: "warn", broken: "bad",
} as const;

function Stamp({ label, value }: { label: string; value: keyof typeof words }) {
  return (
    <div className="stamp-cell">
      <dt>{label}</dt>
      <dd><span className="file-stamp" data-tone={tone[value]}>{words[value]}</span></dd>
    </div>
  );
}

/** The closed case file: what happened, not how well — no scores, no ranks. */
export function CaseArchiveView({ archive, definition }: { archive: CaseArchive; definition?: ArchiveDefinition }) {
  const [diagnosisKo, diagnosisEn] = archive.finalDiagnosis.split(" / ");
  const ending = archive.endingId.replace("END_", "ENDING ");
  return (
    <article className="case-file" aria-label="사건 기록">
      <header>
        <p className="case-file-id">{archive.caseId}</p>
        <h2>{archive.title}</h2>
        {archive.endingTitle && <p className="case-file-ending"><span>{ending}</span>{archive.endingTitle}</p>}
      </header>
      <dl className="case-file-fields">
        <div className="is-wide"><dt>최종 진단</dt><dd><strong>{diagnosisKo}</strong>{diagnosisEn && <small>{diagnosisEn}</small>}</dd></div>
        {archive.firstHypothesis && <div className="is-wide"><dt>처음 세운 가설</dt><dd>{archive.firstHypothesis}</dd></div>}
        <div><dt>{definition?.labels?.biochemicalDiagnosis ?? "생화학적 확인"}</dt><dd>{archive.biochemicalDiagnosis}</dd></div>
        <div><dt>{definition?.labels?.subtypeConfirmation ?? "아형 확인"}</dt><dd>{archive.subtypeConfirmation}</dd></div>
      </dl>
      <dl className="case-file-stamps">
        <Stamp label="진단" value={archive.diagnosis} />
        <Stamp label="치료 시점" value={archive.treatment} />
        <Stamp label="유발 요인" value={archive.trigger} />
        <Stamp label="관계" value={archive.relationship} />
      </dl>
      <dl className="case-file-fields">
        <div className="is-wide"><dt>찾아낸 유발 요인</dt><dd>{archive.triggersDiscovered.join(" · ") || "없음"}</dd></div>
        <div className="is-wide"><dt>합병증</dt><dd>{archive.complications.join(" · ")}</dd></div>
        <div><dt>경과</dt><dd>{archive.outcome}</dd></div>
        <div><dt>후속</dt><dd>{archive.followUp}</dd></div>
      </dl>
    </article>
  );
}

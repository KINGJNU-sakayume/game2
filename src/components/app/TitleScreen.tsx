"use client";
import { useState } from "react";
import { formatGameTime } from "@/game/abilities";
import { chapters, isChapterCompleted, isChapterUnlocked, nextUnplayedChapter } from "@/game/content";
import { resolveAssetUrl } from "@/game/presentation/assetUrl";
import { locationFor, resolveAsset } from "@/game/presentation/scene";
import { TEXT_SPEED_LABEL, useSettings, type TextSpeed } from "@/game/state/settingsStore";
import type { ChapterDefinition, GameState, PersistentProfile } from "@/game/types";
import { CaseArchiveView } from "@/components/stage/CaseArchiveView";
import { Sheet } from "@/components/stage/Sheet";
import { IconLock, IconNext } from "@/components/stage/icons";

type Panel = "chapters" | "archives" | "settings" | null;

function CoverPhoto({ chapter }: { chapter: ChapterDefinition }) {
  const art = resolveAsset(chapter, chapter.cover?.assetId);
  if (art?.type === "asset") {
    return (
      <div className="cover-photo">
        {/* eslint-disable-next-line @next/next/no-img-element -- static export */}
        <img src={resolveAssetUrl(art.asset.src)} alt="" style={{ objectPosition: art.focalPoint ? `${art.focalPoint.x}% ${art.focalPoint.y}%` : undefined }} />
      </div>
    );
  }
  return <div className={`cover-photo backdrop backdrop--${chapter.cover?.backdrop ?? "rain"}`}><i /><b /></div>;
}

function ChapterCard({ chapter, profile, unlockAll, onStart }: { chapter: ChapterDefinition; profile: PersistentProfile; unlockAll: boolean; onStart: (chapter: ChapterDefinition) => void }) {
  const unlocked = isChapterUnlocked(chapter, profile, unlockAll);
  const completed = isChapterCompleted(chapter, profile);
  const archive = profile.archives.find((item) => item.caseId === chapter.completion?.archive.caseId);
  return (
    <li>
      <button type="button" className={`chapter-card ${unlocked ? "" : "is-locked"}`} disabled={!unlocked} onClick={() => onStart(chapter)}>
        <span className="chapter-number">{chapter.number ?? "·"}</span>
        <span className="chapter-text">
          <strong>{chapter.subtitle ?? chapter.title}</strong>
          <span>{unlocked ? chapter.synopsis : "이전 사건을 종결하면 열린다."}</span>
          {completed && <em>종결 · {archive?.endingTitle ?? "기록 보관됨"}</em>}
        </span>
        {unlocked ? <IconNext className="chapter-go" /> : <IconLock className="chapter-go" />}
      </button>
    </li>
  );
}

/**
 * Title screen, laid out like a book cover: one photograph, a vertical title,
 * and a short list of ways in.
 */
export function TitleScreen({ profile, activeRun, activeChapter, unlockAll, onContinue, onStart }: {
  profile: PersistentProfile;
  activeRun: GameState | null;
  activeChapter?: ChapterDefinition;
  unlockAll: boolean;
  onContinue: () => void;
  onStart: (chapter: ChapterDefinition) => void;
}) {
  const [panel, setPanel] = useState<Panel>(null);
  const [pending, setPending] = useState<ChapterDefinition | null>(null);
  const { textSpeed, autoAdvance, update } = useSettings();
  const upcoming = nextUnplayedChapter(profile, unlockAll);
  const featured = activeChapter ?? upcoming;
  const resumable = activeRun && activeChapter && activeRun.currentNodeId !== (activeChapter.completion?.nodeId ?? "CASE_COMPLETE");
  const resumeMeta = resumable ? [activeChapter.number ? `CHAPTER ${activeChapter.number}` : undefined, locationFor(activeChapter, activeRun), formatGameTime(activeRun.time)].filter(Boolean).join(" · ") : undefined;

  const requestStart = (chapter: ChapterDefinition) => {
    if (resumable) setPending(chapter);
    else { setPanel(null); onStart(chapter); }
  };

  return (
    <main className="title">
      <div className="title-frame">
        <p className="title-kicker">AFTER THE RAIN<span>의료 미스터리</span></p>
        <CoverPhoto chapter={featured} />
        <h1 className="title-name" aria-label="비가 그친 뒤">
          <span aria-hidden="true">비가</span><span aria-hidden="true">그친 뒤</span>
        </h1>
        <nav className="title-menu" aria-label="시작 메뉴">
          {resumable && (
            <button type="button" className="title-item is-primary" onClick={onContinue}>
              <span>이어하기</span><small>{resumeMeta}</small>
            </button>
          )}
          <button type="button" className={`title-item ${resumable ? "" : "is-primary"}`} onClick={() => resumable ? setPanel("chapters") : requestStart(upcoming)}>
            <span>{profile.completedCases.length ? "다음 사건" : "새 사건"}</span>
            <small>{upcoming.number ? `CHAPTER ${upcoming.number} · ` : ""}{upcoming.subtitle ?? upcoming.title}</small>
          </button>
          <button type="button" className="title-item" onClick={() => setPanel("chapters")}><span>사건 선택</span></button>
          <button type="button" className="title-item" onClick={() => setPanel("archives")}><span>사건 기록</span>{profile.archives.length > 0 && <small>{profile.archives.length}건 보관</small>}</button>
          <button type="button" className="title-item" onClick={() => setPanel("settings")}><span>설정</span></button>
        </nav>
      </div>

      <Sheet open={panel === "chapters"} onClose={() => { setPanel(null); setPending(null); }} title="사건 선택" kicker="CASES" closeLabel="사건 선택 닫기">
        {pending ? (
          <div className="confirm">
            <p>진행 중인 사건이 있다. 새 사건을 시작하면 지금까지의 진행은 지워진다. 사건 기록과 Case Memory는 남는다.</p>
            <div>
              <button type="button" className="button-quiet" onClick={() => setPending(null)}>그만두기</button>
              <button type="button" className="button-primary" onClick={() => { const chapter = pending; setPending(null); setPanel(null); onStart(chapter); }}>새로 시작</button>
            </div>
          </div>
        ) : (
          <ol className="chapter-list">
            {chapters.map((chapter) => <ChapterCard key={chapter.id} chapter={chapter} profile={profile} unlockAll={unlockAll} onStart={requestStart} />)}
          </ol>
        )}
      </Sheet>

      <Sheet open={panel === "archives"} onClose={() => setPanel(null)} title="사건 기록" kicker="ARCHIVE" closeLabel="사건 기록 닫기">
        {!profile.archives.length ? <p className="chart-empty">아직 종결한 사건이 없다.</p> : (
          <div className="archive-shelf">
            {profile.caseMemories.length > 0 && (
              <section className="memory-shelf" aria-label="Case Memory">
                {profile.caseMemories.map((memory) => <div className="memory-card is-small" key={memory.id}><span className="memory-kicker">Case Memory</span><strong>{memory.title}</strong><p>{memory.description}</p></div>)}
              </section>
            )}
            {profile.archives.map((archive) => {
              const chapter = chapters.find((item) => item.completion?.archive.caseId === archive.caseId);
              return <CaseArchiveView key={archive.caseId} archive={archive} definition={chapter?.completion?.archive} />;
            })}
          </div>
        )}
      </Sheet>

      <Sheet open={panel === "settings"} onClose={() => setPanel(null)} title="설정" closeLabel="설정 닫기">
        <div className="menu">
          <fieldset className="menu-row">
            <legend>글자 속도</legend>
            <div className="segmented">
              {(["slow", "normal", "fast", "instant"] as TextSpeed[]).map((speed) => (
                <button key={speed} type="button" aria-pressed={textSpeed === speed} onClick={() => update({ textSpeed: speed })}>{TEXT_SPEED_LABEL[speed]}</button>
              ))}
            </div>
          </fieldset>
          <div className="menu-row menu-switch">
            <span id="title-auto-label">자동 넘김<small>선택지에서는 멈춘다</small></span>
            <button type="button" role="switch" aria-checked={autoAdvance} aria-labelledby="title-auto-label" className="switch" onClick={() => update({ autoAdvance: !autoAdvance })}><span /></button>
          </div>
        </div>
      </Sheet>
    </main>
  );
}

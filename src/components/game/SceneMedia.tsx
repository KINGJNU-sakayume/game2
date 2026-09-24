export function SceneMedia({ imageKey }: { imageKey?: string }) {
  if (!imageKey) return null;
  return <div className={`scene-media scene-media-${imageKey}`} role="img" aria-label="현재 장면의 분위기 이미지" />;
}

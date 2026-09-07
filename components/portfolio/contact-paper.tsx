'use client';

import { PaperTexture } from '@paper-design/shaders-react';
import { usePaperEraser } from './use-paper-eraser';

export function ContactPaper({ onReveal }: { onReveal: () => void }) {
  const { surface, coating } = usePaperEraser(onReveal);
  return (
    <button ref={surface} type="button" className="paper-note paper-note-erasable"
      aria-label="Зажмите кнопку мыши и сотрите бумажку, чтобы открыть послание. Или нажмите Enter.">
      <div className="paper-note-under" aria-hidden="true">
        <span className="paper-note-label">special for you ♥</span>
      </div>
      <div ref={coating} className="paper-note-cover" aria-hidden="true">
      <div className="paper-note-texture" aria-hidden="true">
        <PaperTexture
          width="100%"
          height="100%"
          colorBack="#ffdcab"
          colorFront="#d3a36b"
          contrast={0.3}
          roughness={0.35}
          fiber={0.3}
          fiberSize={0.2}
          crumples={0.2}
          crumpleSize={0.35}
          folds={0.16}
          foldCount={5}
          drops={0.1}
          fade={0}
          seed={5.8}
          scale={0.6}
          fit="cover"
        />
      </div>
      <span className="paper-note-label">made with love</span>
      </div>
    </button>
  );
}

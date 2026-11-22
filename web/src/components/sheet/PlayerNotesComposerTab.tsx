import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  CalendarClock,
  ImagePlus,
  Send,
  Upload,
} from 'lucide-react';
import type { ApiViewPayload } from '../../types';
import { apiRequest } from '../../lib/api';
import { ImageCropperModal } from '../ImageCropperModal';

export interface StoryPrefill {
  title: string;
  category: 'chronicle_entry' | 'new_npc' | 'location_event';
  body: string;
  subTab?: 'sheet' | 'notes';
}

interface PlayerNotesComposerTabProps {
  view: ApiViewPayload;
  gmKey: string;
  prefill: StoryPrefill | null;
  onClearPrefill: () => void;
  onRefresh: () => Promise<void>;
  onShowToast: (msg: string) => void;
}

export const PlayerNotesComposerTab: React.FC<PlayerNotesComposerTabProps> = ({
  view,
  gmKey,
  prefill,
  onClearPrefill,
  onRefresh,
  onShowToast,
}) => {
  const [noteTitle, setNoteTitle] = useState('');
  const [noteCategory, setNoteCategory] = useState<
    'chronicle_entry' | 'new_npc' | 'location_event'
  >('chronicle_entry');
  const [noteTargetKind, setNoteTargetKind] = useState<'character' | 'campaign'>(
    'campaign',
  );
  const [noteBody, setNoteBody] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  const [activePicker, setActivePicker] = useState<
    'none' | 'image' | 'timeline' | 'lore'
  >('none');
  const [loreQuery, setLoreQuery] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cropDraft, setCropDraft] = useState<{
    src: string;
    fileName: string;
    isVaultGallery: boolean;
  } | null>(null);

  useEffect(() => {
    if (!prefill) return;
    setNoteTitle(prefill.title);
    setNoteCategory(prefill.category);
    setNoteBody(prefill.body);
    onClearPrefill();
  }, [prefill, onClearPrefill]);

  const filteredLore = useMemo(() => {
    const q = loreQuery.trim().toLowerCase();
    const list = view.visibleNodes;
    if (!q) return list.slice(0, 18);
    return list
      .filter((n) => n.title.toLowerCase().includes(q))
      .slice(0, 18);
  }, [view.visibleNodes, loreQuery]);

  const allFestivals = useMemo(
    () => view.plotTimeline.cosmicWheel.flatMap((m) => m.festivals),
    [view.plotTimeline.cosmicWheel],
  );

  const insertSnippet = (snippet: string) => {
    const el = textareaRef.current;
    if (!el) {
      setNoteBody((prev) => (prev ? `${prev}\n${snippet}` : snippet));
      return;
    }
    const start = el.selectionStart ?? noteBody.length;
    const end = el.selectionEnd ?? noteBody.length;
    const next = noteBody.slice(0, start) + snippet + noteBody.slice(end);
    setNoteBody(next);
    setTimeout(() => {
      el.focus();
      const pos = start + snippet.length;
      el.setSelectionRange(pos, pos);
    }, 0);
  };

  const handleSelectDeviceFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      onShowToast('La imagen supera el límite de 6 MB.');
      return;
    }
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
        reader.readAsDataURL(file);
      });
      setCropDraft({ src: dataUrl, fileName: file.name, isVaultGallery: false });
    } catch (err) {
      onShowToast(
        err instanceof Error ? err.message : 'No se pudo abrir la imagen.',
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const uploadAndInsertImage = async (dataUrl: string, fileName: string) => {
    setUploadingImage(true);
    try {
      const res = await apiRequest<{
        stagedFileName?: string;
        fileName?: string;
        wikilink?: string;
      }>(
        '/api/player/media/propose',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignId: view.activeCampaign.id,
            characterId: view.character.id,
            fileName,
            dataUrl,
          }),
        },
        gmKey,
      );
      const savedName = res.stagedFileName || res.fileName || fileName;
      insertSnippet(`\n${res.wikilink || `![[${savedName}]]`}\n`);
      setActivePicker('none');
      onShowToast(`Imagen "${savedName}" preparada y enlazada en tu nota.`);
      await onRefresh();
    } catch (err) {
      onShowToast(
        err instanceof Error ? err.message : 'No se pudo subir la imagen.',
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmitProposal = async () => {
    if (!noteTitle.trim() || !noteBody.trim()) {
      onShowToast('Escribe un título y el contenido de tu nota.');
      return;
    }
    setSubmittingNote(true);
    try {
      await apiRequest(
        '/api/player/propose',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            characterId: view.character.id,
            campaignId: view.activeCampaign.id,
            category: noteCategory,
            targetKind: noteTargetKind,
            title: noteTitle.trim(),
            summary: noteBody.trim().slice(0, 140),
            markdownContent: noteBody.trim(),
          }),
        },
        gmKey,
      );
      setNoteTitle('');
      setNoteBody('');
      setActivePicker('none');
      onShowToast('Propuesta enviada a la cola de aprobación del DM.');
      await onRefresh();
    } catch (err) {
      onShowToast(
        err instanceof Error ? err.message : 'Error enviando propuesta.',
      );
    } finally {
      setSubmittingNote(false);
    }
  };

  return (
    <section className="panel stack">
      <div className="row-between">
        <h2 className="section-title">Mis Notas y Crónicas</h2>
        <span className="muted" style={{ fontSize: '0.78rem' }}>
          Requiere aprobación del DM
        </span>
      </div>

      <div className="stack" style={{ gap: 10 }}>
        <input
          type="text"
          style={{ width: '100%' }}
          placeholder="Título de tu nota o crónica..."
          value={noteTitle}
          onChange={(e) => setNoteTitle(e.target.value)}
        />
        <div className="two-col">
          <select
            value={noteCategory}
            onChange={(e) =>
              setNoteCategory(
                e.target.value as
                  | 'chronicle_entry'
                  | 'new_npc'
                  | 'location_event',
              )
            }
          >
            <option value="chronicle_entry">Crónica / Diario</option>
            <option value="new_npc">PNJ / Personaje</option>
            <option value="location_event">Lugar / Evento</option>
          </select>
          <select
            value={noteTargetKind}
            onChange={(e) =>
              setNoteTargetKind(e.target.value as 'character' | 'campaign')
            }
          >
            <option value="campaign">Carpeta de Campaña</option>
            <option value="character">Diario de {view.character.name}</option>
          </select>
        </div>
      </div>

      <div className="row">
        <button
          type="button"
          className={activePicker === 'image' ? 'btn-primary' : ''}
          onClick={() =>
            setActivePicker((p) => (p === 'image' ? 'none' : 'image'))
          }
        >
          <ImagePlus size={14} /> Imagen y Recorte
        </button>
        <button
          type="button"
          className={activePicker === 'timeline' ? 'btn-primary' : ''}
          onClick={() =>
            setActivePicker((p) => (p === 'timeline' ? 'none' : 'timeline'))
          }
        >
          <CalendarClock size={14} /> Sesión / Evento
        </button>
        <button
          type="button"
          className={activePicker === 'lore' ? 'btn-primary' : ''}
          onClick={() =>
            setActivePicker((p) => (p === 'lore' ? 'none' : 'lore'))
          }
        >
          <BookOpen size={14} /> Lore
        </button>
      </div>

      {activePicker === 'image' && (
        <div className="card-inner stack">
          <div className="row-between">
            <strong style={{ fontSize: '0.84rem' }}>
              Elige o sube una imagen para encuadrarla
            </strong>
            <button
              type="button"
              className="btn-primary"
              disabled={uploadingImage}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} />{' '}
              {uploadingImage ? 'Subiendo...' : 'Subir archivo'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={handleSelectDeviceFile}
            />
          </div>
          <div className="thumb-grid">
            {view.availableImages.map((img) => (
              <button
                key={img}
                type="button"
                className="thumb-btn"
                title={`Encuadrar o insertar ${img}`}
                onClick={() =>
                  setCropDraft({
                    src: `/api/vault/media?file=${encodeURIComponent(img)}`,
                    fileName: img,
                    isVaultGallery: true,
                  })
                }
              >
                <img
                  src={`/api/vault/media?file=${encodeURIComponent(img)}`}
                  alt={img}
                  loading="lazy"
                />
                <span
                  className="muted"
                  style={{
                    fontSize: '0.68rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: '100%',
                  }}
                >
                  {img}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {activePicker === 'timeline' && (
        <div className="card-inner stack">
          <select
            defaultValue=""
            onChange={(e) => {
              if (!e.target.value) return;
              insertSnippet(e.target.value);
              setActivePicker('none');
              e.target.value = '';
            }}
          >
            <option value="">Selecciona sesión o festividad...</option>
            <optgroup label="Sesiones de la Campaña">
              {view.plotTimeline.entries.map((en) => (
                <option key={en.id} value={`[[${en.sessionTag}]]`}>
                  {en.sessionTag} — {en.title}
                </option>
              ))}
            </optgroup>
            <optgroup label="Eventos Cósmicos y Festividades">
              {allFestivals.map((f) => (
                <option key={f.id} value={`[[${f.name}]]`}>
                  {f.name} ({f.deity})
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      )}

      {activePicker === 'lore' && (
        <div className="card-inner stack">
          <input
            type="text"
            placeholder="Buscar Nodo de Lore para enlazar..."
            value={loreQuery}
            onChange={(e) => setLoreQuery(e.target.value)}
          />
          <div className="row">
            {filteredLore.map((n) => (
              <button
                key={n.relativePath}
                type="button"
                className="btn-ghost"
                style={{ fontSize: '0.79rem', padding: '4px 8px' }}
                onClick={() => {
                  insertSnippet(`[[${n.title}]]`);
                  setActivePicker('none');
                }}
              >
                {n.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <textarea
        ref={textareaRef}
        rows={8}
        placeholder="Escribe tu nota o crónica aquí..."
        value={noteBody}
        onChange={(e) => setNoteBody(e.target.value)}
      />

      <div className="row-between" style={{ justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="btn-primary"
          disabled={submittingNote}
          onClick={handleSubmitProposal}
        >
          <Send size={14} />{' '}
          {submittingNote ? 'Enviando...' : 'Enviar propuesta al DM'}
        </button>
      </div>

      <ImageCropperModal
        open={Boolean(cropDraft)}
        imageSrc={cropDraft?.src || ''}
        suggestedFileName={cropDraft?.fileName || 'ilustracion.png'}
        onCancel={() => setCropDraft(null)}
        onConfirm={(dataUrl, fileName) => {
          setCropDraft(null);
          void uploadAndInsertImage(dataUrl, fileName);
        }}
        onUseOriginal={() => {
          const draft = cropDraft;
          setCropDraft(null);
          if (!draft) return;
          if (draft.isVaultGallery) {
            insertSnippet(`\n![[${draft.fileName}]]\n`);
            setActivePicker('none');
          } else {
            void uploadAndInsertImage(draft.src, draft.fileName);
          }
        }}
      />
    </section>
  );
};

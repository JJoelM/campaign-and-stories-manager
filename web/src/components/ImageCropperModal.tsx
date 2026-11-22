import React, { useEffect, useRef, useState } from 'react';
import { Check, Crop, RotateCcw, X, ZoomIn } from 'lucide-react';

interface ImageCropperModalProps {
  open: boolean;
  imageSrc: string;
  suggestedFileName: string;
  onCancel: () => void;
  onConfirm: (croppedDataUrl: string, fileName: string) => void;
  onUseOriginal?: () => void;
}

type AspectPreset = {
  id: string;
  label: string;
  ratio: number; // width / height
};

const ASPECT_PRESETS: AspectPreset[] = [
  { id: '16:9', label: 'Banner 16:9', ratio: 16 / 9 },
  { id: '4:3', label: 'Ilustración 4:3', ratio: 4 / 3 },
  { id: '1:1', label: 'Cuadrado 1:1', ratio: 1 },
  { id: '3:4', label: 'Retrato 3:4', ratio: 3 / 4 },
];

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  open,
  imageSrc,
  suggestedFileName,
  onCancel,
  onConfirm,
  onUseOriginal,
}) => {
  const [preset, setPreset] = useState<AspectPreset>(ASPECT_PRESETS[1]);
  const [zoom, setZoom] = useState<number>(1.15);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number }>({
    w: 800,
    h: 600,
  });
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!open) return;
    setZoom(1.15);
    setOffset({ x: 0, y: 0 });
  }, [open, imageSrc]);

  if (!open || !imageSrc) return null;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      origX: offset.x,
      origY: offset.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;
    setOffset({
      x: Math.max(-280, Math.min(280, dragStartRef.current.origX + dx)),
      y: Math.max(-280, Math.min(280, dragStartRef.current.origY + dy)),
    });
  };

  const handlePointerUp = () => {
    setDragging(false);
    dragStartRef.current = null;
  };

  const handleApplyCrop = () => {
    const frameEl = frameRef.current;
    const imgEl = imgRef.current;
    if (!frameEl || !imgEl) return;

    const frameRect = frameEl.getBoundingClientRect();
    const outWidth = 960;
    const outHeight = Math.round(outWidth / preset.ratio);

    const canvas = document.createElement('canvas');
    canvas.width = outWidth;
    canvas.height = outHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0c0e13';
    ctx.fillRect(0, 0, outWidth, outHeight);

    // Base cover scale inside frameRect
    const imgRatio = naturalSize.w / Math.max(1, naturalSize.h);
    const frameRatio = frameRect.width / Math.max(1, frameRect.height);
    let baseW: number;
    let baseH: number;
    if (imgRatio > frameRatio) {
      baseH = frameRect.height;
      baseW = baseH * imgRatio;
    } else {
      baseW = frameRect.width;
      baseH = baseW / imgRatio;
    }

    const drawW = baseW * zoom;
    const drawH = baseH * zoom;
    const drawX = (frameRect.width - drawW) / 2 + offset.x;
    const drawY = (frameRect.height - drawH) / 2 + offset.y;

    const scaleToOut = outWidth / Math.max(1, frameRect.width);
    ctx.drawImage(
      imgEl,
      drawX * scaleToOut,
      drawY * scaleToOut,
      drawW * scaleToOut,
      drawH * scaleToOut,
    );

    const baseName = suggestedFileName.replace(/\.[^.]+$/, '');
    const finalName = `${baseName}_recorte.png`;
    const dataUrl = canvas.toDataURL('image/png');
    onConfirm(dataUrl, finalName);
  };

  return (
    <div className="overlay-backdrop cropper-backdrop" onClick={onCancel}>
      <div
        className="cropper-modal panel stack"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Recortar y encuadrar imagen"
      >
        <div className="row-between">
          <h3 className="section-title">
            <Crop size={16} /> Encuadrar y Recortar
          </h3>
          <button
            type="button"
            className="btn-ghost btn-icon"
            onClick={onCancel}
            aria-label="Cancelar recorte"
          >
            <X size={16} />
          </button>
        </div>

        {/* Selector de relación de aspecto */}
        <div className="row">
          {ASPECT_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={preset.id === p.id ? 'btn-primary' : ''}
              style={{ fontSize: '0.78rem', padding: '6px 11px' }}
              onClick={() => {
                setPreset(p);
                setOffset({ x: 0, y: 0 });
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Marco interactivo de recorte */}
        <div className="cropper-stage-wrap">
          <div
            ref={frameRef}
            className={`cropper-frame${dragging ? ' dragging' : ''}`}
            style={{ aspectRatio: String(preset.ratio) }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              crossOrigin="anonymous"
              alt="Vista previa de recorte"
              draggable={false}
              onLoad={(e) => {
                const img = e.currentTarget;
                setNaturalSize({
                  w: img.naturalWidth || 800,
                  h: img.naturalHeight || 600,
                });
              }}
              style={{
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
              }}
            />
            <div className="cropper-grid-overlay" aria-hidden="true" />
          </div>
        </div>

        {/* Slider de Zoom */}
        <div className="row-between" style={{ gap: 12 }}>
          <label
            className="row"
            style={{ flex: 1, fontSize: '0.82rem', color: 'var(--muted)' }}
          >
            <ZoomIn size={15} />
            <span>Zoom ({Math.round(zoom * 100)}%)</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{ flex: 1, padding: 0 }}
            />
          </label>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setZoom(1.15);
              setOffset({ x: 0, y: 0 });
            }}
          >
            <RotateCcw size={14} /> Centrar
          </button>
        </div>

        <div className="row-between">
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
          <div className="row">
            {onUseOriginal && (
              <button type="button" onClick={onUseOriginal}>
                Usar original
              </button>
            )}
            <button
              type="button"
              className="btn-primary"
              onClick={handleApplyCrop}
            >
              <Check size={15} /> Usar recorte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

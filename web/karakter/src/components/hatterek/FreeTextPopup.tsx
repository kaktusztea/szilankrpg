import { useState } from 'react';
import { createPortal } from 'react-dom';

interface FreeTextPopupProps {
  label: string;
  onConfirm: (text: string) => void;
  onClose: () => void;
}

export function FreeTextPopup({ label, onConfirm, onClose }: FreeTextPopupProps) {
  const [text, setText] = useState('');

  function handleConfirm() {
    if (text.trim()) onConfirm(text.trim());
  }

  return createPortal(
    <div className="kep-prompt-overlay" onClick={onClose}>
      <div className="kep-prompt" onClick={e => e.stopPropagation()}>
        <label className="hatter-popup-label">{label}</label>
        <input
          className="kep-prompt-input"
          type="text"
          maxLength={20}
          autoFocus
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleConfirm(); if (e.key === 'Escape') onClose(); }}
          placeholder="Kiegészítő szöveg (max 20)"
        />
        <div className="kep-prompt-btns hatter-popup-btns">
          <button onClick={handleConfirm} disabled={!text.trim()}>OK</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

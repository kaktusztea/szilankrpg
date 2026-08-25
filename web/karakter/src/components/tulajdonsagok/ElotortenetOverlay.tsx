import { useState } from 'react';
import type { Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { OverlayPortal } from '../overlays/OverlayPortal';
import { KorPicker } from './KorPicker';
import { VallasPickerOverlay } from './VallasPickerOverlay';
import { MAX_ELOTORTENET_MEZŐ } from '../../ui-constants';

interface Props {
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  data: GameData;
  onClose: () => void;
}

export function ElotortenetOverlay({ karakter, setKarakter, data, onClose }: Props) {
  const [showVallasPicker, setShowVallasPicker] = useState(false);
  const [showKorPicker, setShowKorPicker] = useState(false);
  const et = karakter.előtörténet;

  function setField(field: keyof typeof et, value: string) {
    setKarakter(prev => prev ? { ...prev, előtörténet: { ...prev.előtörténet, [field]: value } } : prev);
  }

  function setTopField<K extends keyof Karakter>(field: K, value: Karakter[K]) {
    setKarakter(prev => prev ? { ...prev, [field]: value } : prev);
  }

  return (
    <OverlayPortal dismissible onClose={onClose}>
      <div className="fullscreen-overlay" onClick={e => e.stopPropagation()}>
        <div className="fullscreen-overlay-header">
          <button className="fullscreen-overlay-close" onClick={onClose}>✕</button>
          <span className="fullscreen-overlay-title">Előtörténet</span>
        </div>
        <div className="fullscreen-overlay-body elotortenet-body">
          {/* Becenév */}
          <div className="elotortenet-field">
            <label className="elotortenet-label">Becenév</label>
            <input
              className="field-input"
              value={karakter.becenév}
              onChange={e => setTopField('becenév', e.target.value.slice(0, 12))}
              maxLength={12}
              placeholder="max 12 karakter"
            />
          </div>

          {/* Név */}
          <div className="elotortenet-field">
            <label className="elotortenet-label">Név</label>
            <input
              className="field-input"
              value={karakter.név}
              onChange={e => setTopField('név', e.target.value.slice(0, 40))}
              maxLength={40}
              placeholder="max 40 karakter"
            />
          </div>

          {/* Kor + Vallás (egy sorban) */}
          <div className="elotortenet-row">
            <div className="elotortenet-field elotortenet-field-narrow">
              <label className="elotortenet-label">Kor</label>
              <button
                type="button"
                className="he-field-btn"
                onClick={() => setShowKorPicker(true)}
              >
                {karakter.kor}
              </button>
            </div>
            <div className="elotortenet-field elotortenet-field-flex1">
              <label className="elotortenet-label">Vallás</label>
              <button
                type="button"
                className="he-field-btn elotortenet-vallas-btn"
                onClick={() => setShowVallasPicker(true)}
              >
                {karakter.vallás || 'Hitetlen'}
              </button>
            </div>
          </div>

          {/* Származás helye */}
          <div className="elotortenet-field">
            <label className="elotortenet-label">Származás helye</label>
            <input
              className="field-input"
              value={et.származás_helye}
              onChange={e => setField('származás_helye', e.target.value.slice(0, 40))}
              maxLength={40}
              placeholder="max 40 karakter"
            />
          </div>

          {/* Szociális érzék */}
          <div className="elotortenet-field">
            <label className="elotortenet-label">Szociális érzék</label>
            <textarea
              className="field-input elotortenet-textarea-sm"
              value={et.szociális_érzék}
              onChange={e => setField('szociális_érzék', e.target.value.slice(0, MAX_ELOTORTENET_MEZŐ))}
              maxLength={MAX_ELOTORTENET_MEZŐ}
              rows={2}
              placeholder={`max ${MAX_ELOTORTENET_MEZŐ} karakter`}
            />
          </div>

          {/* Külső */}
          <div className="elotortenet-field">
            <label className="elotortenet-label">Külső</label>
            <textarea
              className="field-input elotortenet-textarea-sm"
              value={et.külső}
              onChange={e => setField('külső', e.target.value.slice(0, MAX_ELOTORTENET_MEZŐ))}
              maxLength={MAX_ELOTORTENET_MEZŐ}
              rows={2}
              placeholder={`max ${MAX_ELOTORTENET_MEZŐ} karakter`}
            />
          </div>

          {/* Előtörténet (nagy) */}
          <div className="elotortenet-field">
            <label className="elotortenet-label">Előtörténet</label>
            <textarea
              className="field-input elotortenet-textarea-lg"
              value={et.előtörténet}
              onChange={e => setField('előtörténet', e.target.value.slice(0, 5000))}
              maxLength={5000}
              rows={8}
              placeholder="max 5000 karakter"
            />
            <span className="elotortenet-counter">{et.előtörténet.length}/5000</span>
          </div>
        </div>
      </div>

      {showVallasPicker && (
        <VallasPickerOverlay
          data={data}
          current={karakter.vallás}
          onPick={v => { setTopField('vallás', v); setShowVallasPicker(false); }}
          onClose={() => setShowVallasPicker(false)}
        />
      )}

      {showKorPicker && (
        <OverlayPortal dismissible onClose={() => setShowKorPicker(false)}>
          <KorPicker kor={karakter.kor} onSelect={v => setTopField('kor', v)} />
        </OverlayPortal>
      )}
    </OverlayPortal>
  );
}

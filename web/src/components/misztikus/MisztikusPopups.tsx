import { createPortal } from 'react-dom';
import type { Fortely } from '../../engine/types';
import type { FortelySummary } from '../../engine/data-loader';
import { FortélyFelvétel } from '../FortelyFelvetel';

interface TradícióOpció {
  név: string;
  típus: string;
  altípusok: { név: string; leírás?: string; pantheon?: string }[];
}

interface MisztikusPopupsProps {
  // Delete confirm
  deleteTarget: string | null;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  // Szint picker
  szintTarget: string | null;
  currentSzint: number;
  onSzintPick: (szint: number) => void;
  onCancelSzint: () => void;
  // Prompt (Ősi nyelv)
  promptTarget: string | null;
  promptValue: string;
  onPromptChange: (val: string) => void;
  onPromptConfirm: () => void;
  onCancelPrompt: () => void;
  // Tradíció picker
  tradícióPicker: boolean;
  tradícióOpciók: TradícióOpció[];
  onPickTradíció: (név: string) => void;
  onPickTradícióAltípus: (név: string) => void;
  onCancelTradíció: () => void;
  // Tradíció altípus picker
  tradícióAltípusPicker: string | null;
  onConfirmAltípus: (tradíció: string, altípus: string) => void;
  onCancelAltípus: () => void;
  // Fortély felvétel
  felvételDef: FortelySummary | null;
  fortélyok: Fortely[];
  onFelvételDone: (result: Fortely) => void;
  onFelvételCancel: () => void;
  // Misztikus fok
  misztFokTarget: number | null;
  misztFokMaxfok: number;
  misztFokCurrentFok: number;
  onFokPick: (fok: number) => void;
  onCancelFok: () => void;
  // Delete fortély
  deleteFortIdx: number | null;
  deleteFortNév: string;
  onConfirmDeleteFort: () => void;
  onCancelDeleteFort: () => void;
}

function Overlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return createPortal(
    <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) onClose(); }}>
      {children}
    </div>,
    document.body
  );
}

export function MisztikusPopups(props: MisztikusPopupsProps) {
  return (
    <>
      {props.deleteTarget && (
        <Overlay onClose={props.onCancelDelete}>
          <div className="kep-prompt" style={{ alignItems: 'center', gap: '12px' }}>
            <label style={{ fontWeight: 'bold' }}>{props.deleteTarget}</label>
            <button className="btn-del-confirm he-del-confirm" onClick={props.onConfirmDelete}>Képzettség törlése</button>
          </div>
        </Overlay>
      )}

      {props.szintTarget && (
        <Overlay onClose={props.onCancelSzint}>
          <div className="kep-prompt">
            <label>{props.szintTarget.includes(':') ? props.szintTarget.split(':')[1].trim() : props.szintTarget} — szint:</label>
            <div className="kep-szint-grid">
              {buildSzintOptions(props.szintTarget).map(n => (
                <button key={n} className={`fort-fok-btn ${props.currentSzint === n ? 'active' : ''}`}
                  onClick={() => props.onSzintPick(n)}>{n}</button>
              ))}
            </div>
          </div>
        </Overlay>
      )}

      {props.promptTarget && (
        <Overlay onClose={props.onCancelPrompt}>
          <div className="kep-prompt">
            <label>{props.promptTarget}: név</label>
            <input autoFocus maxLength={30} value={props.promptValue}
              onChange={e => props.onPromptChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && props.promptValue.trim()) props.onPromptConfirm();
                if (e.key === 'Escape') props.onCancelPrompt();
              }} />
            <div className="kep-prompt-btns">
              <button onClick={props.onPromptConfirm} disabled={!props.promptValue.trim()}>OK</button>
            </div>
          </div>
        </Overlay>
      )}

      {props.tradícióPicker && (
        <Overlay onClose={props.onCancelTradíció}>
          <div className="kep-prompt">
            <label style={{ fontWeight: 'bold', marginBottom: '8px' }}>Tradíció választás</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '60vh', overflowY: 'auto' }}>
              {props.tradícióOpciók.map(t => (
                <button key={t.név} className="he-field-btn" onClick={() => {
                  if (t.altípusok.length > 0) props.onPickTradícióAltípus(t.név);
                  else props.onPickTradíció(t.név);
                }}>
                  {t.név} {t.altípusok.length > 0 && '▸'}{' '}
                  <span style={{ color: 'var(--text-dim)', fontSize: '13px' }}>({t.típus})</span>
                </button>
              ))}
            </div>
          </div>
        </Overlay>
      )}

      {props.tradícióAltípusPicker && (
        <Overlay onClose={props.onCancelAltípus}>
          <div className="kep-prompt">
            <label style={{ fontWeight: 'bold', marginBottom: '8px' }}>{props.tradícióAltípusPicker} — altípus</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '60vh', overflowY: 'auto' }}>
              <AltípusLista
                tradícióOpciók={props.tradícióOpciók}
                tradícióNév={props.tradícióAltípusPicker}
                onPick={altípus => props.onConfirmAltípus(props.tradícióAltípusPicker!, altípus)}
              />
            </div>
          </div>
        </Overlay>
      )}

      {props.felvételDef && (
        <FortélyFelvétel
          def={props.felvételDef}
          kiérdemeltOpció={false}
          felvettSpecElemek={props.fortélyok.filter(f => f.név === props.felvételDef!.név).map(f => f.spec_elem)}
          onDone={props.onFelvételDone}
          onCancel={props.onFelvételCancel}
        />
      )}

      {props.misztFokTarget !== null && (
        <Overlay onClose={props.onCancelFok}>
          <div className="kep-prompt">
            <label>{props.deleteFortNév || 'Fortély'} — fok:</label>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {Array.from({ length: props.misztFokMaxfok }, (_, i) => i + 1).map(n => (
                <button key={n} className={`fort-fok-btn ${props.misztFokCurrentFok === n ? 'active' : ''}`}
                  onClick={() => props.onFokPick(n)}>{n}</button>
              ))}
            </div>
          </div>
        </Overlay>
      )}

      {props.deleteFortIdx !== null && (
        <Overlay onClose={props.onCancelDeleteFort}>
          <div className="kep-prompt" style={{ alignItems: 'center', gap: '12px' }}>
            <label style={{ fontWeight: 'bold' }}>{props.deleteFortNév}</label>
            <button className="btn-del-confirm he-del-confirm" onClick={props.onConfirmDeleteFort}>Fortély törlése</button>
          </div>
        </Overlay>
      )}
    </>
  );
}

function buildSzintOptions(szintTarget: string): number[] {
  const minSzint = szintTarget.startsWith('Faj misztérium') ? 0 : 1;
  return Array.from({ length: (minSzint === 0 ? 16 : 15) }, (_, i) => i + minSzint);
}

function AltípusLista({ tradícióOpciók, tradícióNév, onPick }: {
  tradícióOpciók: { név: string; altípusok: { név: string; leírás?: string; pantheon?: string }[] }[];
  tradícióNév: string;
  onPick: (altípus: string) => void;
}) {
  const trad = tradícióOpciók.find(t => t.név === tradícióNév);
  if (!trad) return null;

  const hasPantheon = trad.altípusok.some(a => a.pantheon);
  if (!hasPantheon) {
    return <>{trad.altípusok.map(a => (
      <button key={a.név} className="he-field-btn" onClick={() => onPick(a.név)}>{a.név}</button>
    ))}</>;
  }

  const byPantheon = new Map<string, typeof trad.altípusok>();
  for (const a of trad.altípusok) {
    const p = a.pantheon || '';
    if (!byPantheon.has(p)) byPantheon.set(p, []);
    byPantheon.get(p)!.push(a);
  }

  return (
    <>
      {[...byPantheon.entries()].map(([pantheon, items]) => (
        <div key={pantheon}>
          <div className="miszt-section-label">{pantheon}</div>
          {items.map(item => (
            <button key={item.név} className="he-field-btn" onClick={() => onPick(item.név)}>
              {item.név} {item.leírás && <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>— {item.leírás}</span>}
            </button>
          ))}
        </div>
      ))}
    </>
  );
}

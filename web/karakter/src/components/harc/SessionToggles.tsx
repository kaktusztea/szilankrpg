import { useEffect } from 'react';
import type { HarcBaseProps } from './types';

interface Props extends Pick<HarcBaseProps, 'data' | 'karakter' | 'session' | 'setSession'> {
  páncélMGT: number;
  showHint: (msg: string) => void;
}

export function SessionToggles({ data, karakter, session, setSession, páncélMGT, showHint }: Props) {
  const toggleForts = data.fortelySummaries.filter(d => d.session_toggle);

  // Harci akrobatika disabled check: struktúra flag + MGT limit (data-driven)
  const páncélStruktúra = (data.konstansok.páncél_struktúrák as { struktúra: string; harci_akrobatika: boolean }[])
    .find(s => s.struktúra === karakter.páncél.alap);
  const harciAkroEngedett = páncélStruktúra?.harci_akrobatika;
  const harciAkroMaxMgt = (data.konstansok.harci_akrobatika as { max_mgt: number }).max_mgt;
  const harciAkroDisabled = session.aktív_páncél && (!harciAkroEngedett || páncélMGT > harciAkroMaxMgt);

  // Force OFF when disabled
  useEffect(() => {
    if (harciAkroDisabled && session.harci_akrobatika) {
      setSession(s => ({ ...s, harci_akrobatika: false }));
    }
  }, [harciAkroDisabled, session.harci_akrobatika, setSession]);

  return (
    <>
      {toggleForts.map(tf => {
        const has = karakter.fortélyok.some(f => f.név === tf.név && f.fok > 0);
        const sessionKey = tf.név.toLowerCase().replace(/ /g, '_');
        const active = (session as unknown as Record<string, unknown>)[sessionKey] as boolean ?? false;
        // Per-toggle feltétel disabled (jelenleg csak Harci akrobatika)
        const feltételDisabled = sessionKey === 'harci_akrobatika' && harciAkroDisabled;
        const disabled = !has || feltételDisabled;
        return (
          <div key={tf.név} className={`aktiv-field-btn aktiv-field-toggle ${active && !disabled ? 'on' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={() => {
              if (feltételDisabled) { showHint(`Páncél: posztó/fegyverkabát/bőr, max MGT:${harciAkroMaxMgt}`); return; }
              if (has) setSession(s => ({ ...s, [sessionKey]: !active }));
            }}>
            <span className="aktiv-field-label">{tf.név.length > 14 ? tf.név.replace('Harci ', 'H. ') : tf.név}</span>
            <strong>{active && !disabled ? 'Igen' : 'Nem'}</strong>
          </div>
        );
      })}
    </>
  );
}

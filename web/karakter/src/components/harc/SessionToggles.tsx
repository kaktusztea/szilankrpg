import { useEffect } from 'react';
import type { HarcBaseProps } from './types';

interface Props extends Pick<HarcBaseProps, 'data' | 'karakter' | 'session' | 'setSession'> {
  páncélMGT: number;
  showHint: (msg: string) => void;
}

export function SessionToggles({ data, karakter, session, setSession, páncélMGT, showHint }: Props) {
  const toggleForts = data.fortelySummaries.filter(d => d.session_toggle);

  // Harci akrobatika disabled checks
  const páncélStruktúra = (data.konstansok.páncél_struktúrák as { struktúra: string; harci_akrobatika: boolean }[])
    .find(s => s.struktúra === karakter.páncél.alap);
  const harciAkroEngedett = páncélStruktúra?.harci_akrobatika;
  const harciAkroMaxMgt = (data.konstansok.harci_akrobatika as { max_mgt: number }).max_mgt;
  const harciAkroPáncélDisabled = session.aktív_páncél && (!harciAkroEngedett || páncélMGT > harciAkroMaxMgt);

  // Akrobatika képzettség követelmény check
  const harciAkroDef = toggleForts.find(d => d.név === 'Harci akrobatika');
  const harciAkroFok = karakter.fortélyok.find(f => f.név === 'Harci akrobatika' && f.fok > 0);
  const harciAkroFokDef = harciAkroFok && harciAkroDef?.fokok.find(fd => fd.fok === harciAkroFok.fok);
  const harciAkroKov = harciAkroFokDef?.követelmények.find(k => k.típus === 'képzettség' && (Array.isArray(k.név) ? k.név.includes('Akrobatika') : k.név === 'Akrobatika'));
  const akroSzint = karakter.képzettségek.find(kp => kp.név === 'Akrobatika')?.szint ?? 0;
  const harciAkroKovDisabled = !!(harciAkroKov && akroSzint < harciAkroKov.érték);

  const harciAkroDisabled = harciAkroPáncélDisabled || harciAkroKovDisabled;

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
        const feltételDisabled = sessionKey === 'harci_akrobatika' && harciAkroDisabled;
        const disabled = !has || feltételDisabled;
        return (
          <div key={tf.név} className={`aktiv-field-btn aktiv-field-toggle ${active && !disabled ? 'on' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={() => {
              if (disabled) {
                if (sessionKey === 'harci_akrobatika') {
                  const lines: string[] = [];
                  if (!has) lines.push('Harci akrobatika fortély hiányzik');
                  if (session.aktív_páncél && !harciAkroEngedett) lines.push('Páncél: posztó / fegyverkabát / bőr');
                  if (session.aktív_páncél && páncélMGT > harciAkroMaxMgt) lines.push(`max MGT: ${harciAkroMaxMgt}`);
                  if (harciAkroKovDisabled) lines.push(`Akrobatika képzettség: >=${harciAkroKov!.érték}`);
                  if (lines.length > 0) showHint(lines.join('\n'));
                }
                return;
              }
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

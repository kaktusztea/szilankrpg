import { useEffect } from 'react';
import type { HarcBaseProps } from './types';
import { getFegyverhossz } from './fegyver-helpers';
import { képzettségSzint } from '../../engine/utils';

interface Props extends Pick<HarcBaseProps, 'data' | 'karakter' | 'session' | 'setSession'> {
  páncélMGT: number;
  showHint: (msg: string) => void;
}

export function SessionToggles({ data, karakter, session, setSession, páncélMGT, showHint }: Props) {
  const toggleForts = data.fortelySummaries.filter(d => d.session_toggle);

  // Harci akrobatika: a fortély AKTUÁLIS fokának követelményeiből (fok-függő: fok 3 lazább páncél/MGT).
  const harciAkroDef = toggleForts.find(d => d.név === 'Harci akrobatika');
  const harciAkroFok = karakter.fortélyok.find(f => f.név === 'Harci akrobatika' && f.fok > 0);
  const harciAkroFokDef = harciAkroFok && harciAkroDef?.fokok.find(fd => fd.fok === harciAkroFok.fok);
  const harciAkroKövek = harciAkroFokDef?.követelmények ?? [];

  const kov = (típus: string) => harciAkroKövek.find(k => k.típus === típus);

  // Akrobatika képzettség
  const akroKépz = harciAkroKövek.find(k => k.típus === 'képzettség' && (Array.isArray(k.név) ? k.név.includes('Akrobatika') : k.név === 'Akrobatika'));
  const akroSzint = képzettségSzint(karakter, 'Akrobatika');
  const akroKépzHiba = !!(akroKépz && akroSzint < akroKépz.érték);

  // Páncél hajlékonyság (nem_fém | nem_merev) — a struktúra fém/merev flagjéből (l. konstansok.páncél_struktúrák).
  const páncélStruktúra = (data.konstansok.páncél_struktúrák as { struktúra: string; fém: boolean; merev: boolean }[])
    .find(s => s.struktúra === karakter.páncél.alap);
  const hajlKöv = kov('páncél_hajlékonyság');
  const hajlÉrték = hajlKöv?.érték as unknown as string | undefined;
  const hajlOk = !hajlÉrték || !páncélStruktúra
    ? true
    : hajlÉrték === 'nem_merev' ? !páncélStruktúra.merev
    : hajlÉrték === 'nem_fém' ? !páncélStruktúra.fém
    : true;
  const páncélHajlHiba = !!(session.aktív_páncél && !hajlOk);

  // Max effektív MGT (a páncélMGT már Erő-korrigált, l. rules.json páncél_MGT formula).
  const mgtKöv = kov('max_effektív_mgt');
  const mgtHiba = !!(session.aktív_páncél && mgtKöv && páncélMGT > mgtKöv.érték);

  // Max össz fegyverméret (jobb + bal kéz fegyverhosszának összege).
  const jobbFh = session.aktív_fegyver_index >= 0 ? getFegyverhossz(data, karakter.fegyverek[session.aktív_fegyver_index]?.alap ?? '') : 0;
  const balFh = session.aktív_fegyver_bal_index >= 0 ? getFegyverhossz(data, karakter.fegyverek[session.aktív_fegyver_bal_index]?.alap ?? '') : 0;
  const összFh = jobbFh + balFh;
  const fhKöv = kov('max_össz_fegyverméret');
  const fhHiba = !!(fhKöv && összFh > fhKöv.érték);

  const harciAkroDisabled = akroKépzHiba || páncélHajlHiba || mgtHiba || fhHiba;

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
                  if (páncélHajlHiba) lines.push(hajlÉrték === 'nem_merev' ? 'Páncél: nem-merev (Hajlékony) vért' : 'Páncél: posztó / fegyverkabát / bőr');
                  if (mgtHiba) lines.push(`max effektív MGT: ${mgtKöv!.érték}`);
                  if (fhHiba) lines.push(`max össz fegyverméret: ${fhKöv!.érték} (most ${összFh})`);
                  if (akroKépzHiba) lines.push(`Akrobatika képzettség: >=${akroKépz!.érték}`);
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

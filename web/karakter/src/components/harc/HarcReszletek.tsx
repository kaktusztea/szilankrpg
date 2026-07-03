import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import type { FegyverResult } from './types';
import { calcReszletekData, type KétkezesBontás } from './harc-reszletek-calc';

interface Props {
  karakter: Karakter;
  session: Session;
  data: GameData;
  fegyverResults: FegyverResult[];
  kétkezesResult: (FegyverResult & { sumPengehossz: number }) | null;
  fogásResult: { név: string; VÉ_bónusz: number; TÉ_büntetés: number } | null;
  taktikaMods: Record<string, number>;
  fortelyMods: Record<string, number>;
  téLevonás: number;
  pajzsVÉ: number;
  páncélMGT: number;
  merevvértBüntetés: number;
}

function fmtMod(val: number): string {
  return val > 0 ? `+${val}` : `${val}`;
}

/** Összefogott összetevő-sor kirajzolása: csak nem-nulla értékeket jelenít meg. */
function DetailParts({ parts }: { parts: [string, number][] }) {
  return <>{parts.filter(([, v]) => v !== 0).map(([label, v]) => ` · ${label}: ${fmtMod(v)}`).join('')}</>;
}

/** Kétkezes fegyver+MF bontás egy harcértékhez (TÉ vagy VÉ). */
function KétkezesFegyverMf({ kh, mező }: { kh: KétkezesBontás; mező: 'TÉ' | 'VÉ' }) {
  const mfMező = mező === 'TÉ' ? 'mfTÉ' : 'mfVÉ';
  const parts: [string, number][] = [
    [kh.nagyobb.név, kh.nagyobb[mező]],
    [kh.kisebb.név, kh.kisebb[mező]],
    [`MF(${kh.nagyobb.név})`, kh.nagyobb[mfMező]],
    [`MF(${kh.kisebb.név})`, kh.kisebb[mfMező]],
  ];
  return <DetailParts parts={parts} />;
}

export function HarcReszletek({ karakter, session, data, fegyverResults, kétkezesResult, fogásResult, taktikaMods, fortelyMods, téLevonás, pajzsVÉ, páncélMGT, merevvértBüntetés }: Props) {
  const d = calcReszletekData(karakter, session, data, fegyverResults, kétkezesResult, fogásResult, taktikaMods, téLevonás, pajzsVÉ, páncélMGT, merevvértBüntetés);
  if (!d) return null;

  const { konstansok } = data;
  const k = karakter;
  const r = d.result;

  return (
    <div className="debug-box harc-reszletek">
      <strong className="debug-box-title">Részletes értékek</strong>

      <Section label="Név">
        {d.fegyverNév} [{d.kategória}]
      </Section>

      <Section label={`Támadás/kör: ${r.támadások}`}>
        Harckeret: {r.harckeret} ({d.harcmodorNév} {d.harcmodorSzint} + Gyor {k.tulajdonságok.gyorsaság}
        {d.páncélMGT > 0 ? ` − MGT ${d.páncélMGT}` : ''}
        {fortelyMods['harckeret'] ? ` + Fortély ${fmtMod(fortelyMods['harckeret'])}` : ''}) ÷ Sebesség: {r.sebesség}
      </Section>

      <Section label={`TÉ: ${d.finalTÉ}`}>
        Alap: {konstansok.harcérték_alap.TÉ} · Erő: {k.tulajdonságok.erő} · Ügy: {k.tulajdonságok.ügyesség} · Gyor: {k.tulajdonságok.gyorsaság} · HM: {k.HM_TÉ}
        <DetailParts parts={[['Harcmodor', d.harcmodorTÉ]]} />
        {d.kétkezes
          ? <KétkezesFegyverMf kh={d.kétkezes} mező="TÉ" />
          : <DetailParts parts={[['Fegyver', r.alap_TÉ], ['MF', d.mfTÉ]]} />}
        <DetailParts parts={[
          ['Fortély', fortelyMods['TÉ']],
          ['Merevvért', d.merevvértBüntetés ? -d.merevvértBüntetés : 0],
          ['Taktika', taktikaMods['TÉ']],
          ['Fogás', d.téFogásBüntetés],
          ['Több tám', d.többTám],
          ['Sérülés', téLevonás],
        ]} />
      </Section>

      <Section label={`VÉ: ${d.finalVÉ}`}>
        Alap: {konstansok.harcérték_alap.VÉ} · Gyor: {k.tulajdonságok.gyorsaság} · Ügy: {k.tulajdonságok.ügyesség} · HM: {k.HM_VÉ}
        <DetailParts parts={[['Harcmodor', d.harcmodorVÉ]]} />
        {d.kétkezes
          ? <KétkezesFegyverMf kh={d.kétkezes} mező="VÉ" />
          : <DetailParts parts={[['Fegyver', r.alap_VÉ], ['MF', d.mfVÉ]]} />}
        <DetailParts parts={[
          ['Fortély', fortelyMods['VÉ']],
          ['Fogás', d.véFogásBónusz],
          ...(!fogásResult && pajzsVÉ ? [['Pajzs', pajzsVÉ] as [string, number]] : []),
          ['Taktika', taktikaMods['VÉ']],
          ['Csökkenés', session.vé_csökkenés ? -session.vé_csökkenés : 0],
        ]} />
      </Section>

      <Section label={`SP: ${d.finalSP} ${r.sebzésmód}`}>
        Fegyver: {d.fegyverAlapSP} · Erőbónusz: {d.erőBónusz}{d.erőBónuszLimit < 99 && ` (limit: ${d.erőBónuszLimit})`}
        {d.kétkezes
          ? <DetailParts parts={[
              [`MF(${d.kétkezes.nagyobb.név})`, d.kétkezes.nagyobb.mfSP],
              [`MF(${d.kétkezes.kisebb.név})`, d.kétkezes.kisebb.mfSP],
            ]} />
          : <DetailParts parts={[['MF', d.mfSP]]} />}
        <DetailParts parts={[['Fortély', fortelyMods['SP']], ['Taktika', taktikaMods['SP']]]} />
      </Section>

      <Section label={`Pengehossz: ${r.pengehossz + (fortelyMods['pengehossz'] ?? 0)}`}>
        Alap: {r.pengehossz}
        <DetailParts parts={[['Fortély', fortelyMods['pengehossz'] ?? 0]]} />
        {d.sumPengehossz !== null && ` · Összpenge: ${d.sumPengehossz + (fortelyMods['pengehossz'] ?? 0)}`}
      </Section>
    </div>
  );
}

/** Egyszerű szekció wrapper. */
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="harc-reszletek-section">
      <span className="harc-reszletek-label">{label}</span>
      <div className="harc-reszletek-indent">{children}</div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { loadGameData } from './engine/data-loader';
import type { GameData } from './engine/data-loader';
import { calcKp } from './engine/kp';
import type { KpBonusz } from './engine/kp';
import { calcTulajdonsagPontok } from './engine/tulajdonsag';
import { calcEp } from './engine/ep';
import { calcKE, calcFegyverHarcertekek } from './engine/harcertek';
import { calcManoverPont, calcFelszerelésMgt, calcMaxHM, calcMaxCM, calcMaxHMDiff } from './engine/limits';
import { calcPancel } from './engine/pancel';
import { testKarakter8, expected8 } from './testdata';

function check(label: string, got: number, want: number): string {
  const ok = got === want;
  return `${ok ? '✅' : '❌'} ${label}: ${got} (elvárt: ${want})`;
}

function App() {
  const [data, setData] = useState<GameData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadGameData().then(setData).catch(e => setError(String(e)));
  }, []);

  if (error) return <div style={{ color: 'red' }}>Hiba: {error}</div>;
  if (!data) return <div>Betöltés...</div>;

  const { konstansok, kepzettsegKp, harcmodorBonusz, fegyverek } = data;
  const k = testKarakter8;

  // §1 KP
  const primerKepz = new Set(["Közelharc", "Kardvívás", "Rombolás", "Akrobatika", "Fájdalomtűrés", "Észlelés"]);
  const primerFort = new Set(["Merevvértviselet", "Harcos elme", "Gyors kezdeményezés", "Pajzshasználat", "Harckeret növelés", "Elpusztíthatatlan", "Kaszabolás", "Támadás erőből", "Fárasztás", "Mesterfegyver"]);
  const kpBonusz: KpBonusz = konstansok.kp_bónusz;
  const kpResult = calcKp(k, konstansok.kp, kpBonusz, kepzettsegKp, primerKepz, primerFort);

  // §2 Tulajdonság
  const tulajResult = calcTulajdonsagPontok(k.tulajdonságok, k.tsz, konstansok.tulajdonság_pontok, konstansok.arányok.tulajdonság_pont_alap);

  // §3 ÉP
  const epResult = calcEp(k.tulajdonságok.edzettség);

  // §4 KÉ: alap(0) + Gyo(3) + Int(1) + TSz(8) + Gyors kezdeményezés 2.fok(+4) + Harckeret növelés 1.fok(+1) = 17
  const fortelyKE = 4 + 1; // Gyors kezdeményezés 2.fok + Harckeret növelés 1.fok
  const ké = calcKE(k.tulajdonságok, k.tsz, konstansok.harcérték_alap, fortelyKE);

  // §5 TÉ - Kard, lovag
  const kardLovag = fegyverek.find(f => f.Fegyver.toLowerCase().includes('lovag'));
  const kardvívásB = harcmodorBonusz.find(b => b.szint === 8);
  const mfBonuszok = konstansok.mesterfegyver_bónuszok;

  let kardTÉ = 0;
  let kardVÉ = 0;
  let kardTám = 0;
  if (kardLovag && kardvívásB) {
    const result = calcFegyverHarcertekek(
      k.tulajdonságok,
      k.HM_TÉ,
      k.HM_VÉ,
      8, // Kardvívás szint
      { TÉ: kardvívásB.TÉ, VÉ: kardvívásB.VÉ },
      kardLovag,
      3, // Mesterfegyver 3.fok
      mfBonuszok,
      konstansok.harcérték_alap,
      0, // fortély TÉ (Harci akrobatika nincs)
      0, // fortély VÉ
      0, // fortély SP
      1, // fortély harckeret (Harckeret növelés 1.fok)
      2, // páncél MGT
      0, // felszerelés MGT
    );
    kardTÉ = result.TÉ;
    kardVÉ = result.VÉ;
    kardTám = result.támadások;
  }

  // §10-11 Páncél
  const pancelResult = calcPancel(
    k.páncél,
    konstansok.páncél_struktúrák,
    konstansok.páncél_fémalapanyagok,
    konstansok.páncél_csatolt_tag_mgt,
    3, // Merevvértviselet 3.fok (de bőr nem merev, szóval nincs hatás)
    konstansok.merevvértviselet_bónuszok,
    k.tulajdonságok.erő,
  );

  // §14 Manőver Pont
  const manöverPont = calcManoverPont([6, 8, 4, 0, 0], k.tsz); // Közelharc 6, Kardvívás 8, Rombolás 4

  // §15 Felszerelés MGT
  const felszMgt = calcFelszerelésMgt(k.felszerelés.nagy_tárgyak.map(t => t.MGT), k.tulajdonságok.erő);

  // §18 HM/CM
  const összFortelyFok = k.fortélyok.filter(f => primerFort.has(f.név)).reduce((s, f) => s + f.fok, 0);
  const összHarcmodorSzint = [6, 8, 4, 0, 0]; // Közelharc, Kardvívás, Rombolás, Lándzsa, Ostor
  const alakzatharcSzint = 0;
  const maxHM = calcMaxHM(összFortelyFok, összHarcmodorSzint, alakzatharcSzint);
  const maxCM = calcMaxCM(k.tsz, konstansok.arányok);
  const maxDiff = calcMaxHMDiff(k.tsz);

  const results = [
    check('ÉP', epResult.ÉP, expected8.ÉP),
    check('KÉ', ké, expected8.KÉ),
    check('Összes KP', kpResult.összes_kp, expected8.összes_kp),
    check('Összes szekunder KP', kpResult.összes_szekunder_kp, expected8.összes_szekunder_kp),
    check('Maradék KP', kpResult.maradék_kp, expected8.maradt_kp),
    check('Tulajdonság keret', tulajResult.keret, expected8.tulajdonság_pont_keret),
    check('Kard lovag TÉ', kardTÉ, expected8.kard_lovag.TÉ),
    check('Kard lovag VÉ', kardVÉ, expected8.kard_lovag.VÉ),
    check('Kard lovag Tám/kör', kardTám, expected8.kard_lovag.támadások),
    check('Páncél SFÉ fizikai', pancelResult.sfé_fizikai, expected8.páncél.sfé_fizikai),
    check('Páncél SFÉ energia', pancelResult.sfé_energia, expected8.páncél.sfé_energia),
    check('Páncél MGT', pancelResult.MGT, expected8.páncél.MGT),
    check('Páncél lefedettség', pancelResult.lefedettség, expected8.páncél.lefedettség),
    check('Max Manőver Pont', manöverPont, expected8.max_manőver_pont),
    check('Max HM', maxHM, expected8.max_HM),
    check('Max CM', maxCM, expected8.max_CM),
    check('Max HM diff', maxDiff, 4), // floor(8/2) = 4
    check('Felszerelés MGT', felszMgt, 0),
  ];

  return (
    <div style={{ fontFamily: 'monospace', padding: '1rem' }}>
      <h1>Engine Validáció — {k.név} (TSz {k.tsz})</h1>
      <h2>Eredmények</h2>
      {results.map((r, i) => <div key={i}>{r}</div>)}
      <h2>KP részletek</h2>
      <pre>{JSON.stringify(kpResult, null, 2)}</pre>
      {!kardLovag && <div style={{color:'red'}}>❌ "kard, lovag" fegyver nem található a fegyverek.json-ban!</div>}
    </div>
  );
}

export default App;

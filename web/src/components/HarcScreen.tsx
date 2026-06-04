import { useState } from 'react';
import type { GameData } from '../engine/data-loader';
import { testKarakter8 } from '../testdata';
import { calcEp } from '../engine/ep';
import { calcKE, calcFegyverHarcertekek } from '../engine/harcertek';
import { calcPancel } from '../engine/pancel';
import { calcManoverPont } from '../engine/limits';
import { EpTable } from './EpTable';
import './HarcScreen.css';

export function HarcScreen({ data }: { data: GameData }) {
  const [véCsökkenés, setVéCsökkenés] = useState(0);
  const [aktManöverPont, setAktManöverPont] = useState(99);

  const k = testKarakter8;
  const { konstansok, harcmodorBonusz } = data;

  // ÉP
  const ep = calcEp(k.tulajdonságok.edzettség);

  // KÉ
  const fortelyKE = 4 + 1; // Gyors kezdeményezés 2.fok + Harckeret növelés 1.fok
  const ké = calcKE(k.tulajdonságok, k.tsz, konstansok.harcérték_alap, fortelyKE);

  // Páncél
  const pancel = calcPancel(
    k.páncél, konstansok.páncél_struktúrák, konstansok.páncél_fémalapanyagok,
    konstansok.páncél_csatolt_tag_mgt, 3, konstansok.merevvértviselet_bónuszok, k.tulajdonságok.erő,
  );

  // Manőver
  const manöverPont = calcManoverPont([6, 8, 4, 0, 0], k.tsz);

  // Fegyverek
  const fegyverNevek = ['Puszta kéz', 'Kard, lovag'];
  const fegyverResults = fegyverNevek.map(név => {
    const fDef = data.fegyverek.find(f => f.Fegyver.toLowerCase() === név.toLowerCase());
    if (!fDef) return null;
    const isFegyver = név !== 'Puszta kéz';
    const harcmodorSzint = isFegyver ? 8 : 6; // Kardvívás 8 / Közelharc 6
    const hb = harcmodorBonusz.find(b => b.szint === harcmodorSzint);
    const mfFok = isFegyver ? 2 : 0;
    return calcFegyverHarcertekek(
      k.tulajdonságok, k.HM_TÉ, k.HM_VÉ, harcmodorSzint,
      { TÉ: hb?.TÉ ?? 0, VÉ: hb?.VÉ ?? 0 }, fDef, mfFok,
      konstansok.mesterfegyver_bónuszok, konstansok.harcérték_alap,
      0, 0, 0, 1, pancel.MGT, 0,
    );
  });

  // Pajzs VÉ (Közepes pajzs, 2.fok)
  const pajzsVÉ = 10;

  return (
    <div className="screen harc-screen">
      <div className="harc-header">
        <div className="ke-box"><span className="label">KÉ</span><span className="value">{ké}</span></div>
        <div className="sfe-box">
          <span className="label">SFÉ</span>
          <span>Fizikai: {pancel.sfé_fizikai}</span>
          <span>Energia: {pancel.sfé_energia}</span>
          <span className="dim">Lefedettség: {pancel.lefedettség}%</span>
        </div>
      </div>

      <h3>Teljes harcértékek</h3>
      <table className="harc-table">
        <thead>
          <tr><th>Fegyver</th><th>Tám</th><th>TÉ</th><th>VÉ</th><th>SP</th><th>Ph</th></tr>
        </thead>
        <tbody>
          {fegyverResults.map((r, i) => r && (
            <tr key={i}>
              <td>{r.fegyver_név}</td>
              <td>{r.támadások}</td>
              <td>{r.TÉ}</td>
              <td>{r.VÉ + pajzsVÉ}</td>
              <td>{r.SP} {r.sebzésmód}</td>
              <td>{r.pengehossz}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="harc-section">
        <div className="ve-csokk">
          <span>VÉ csökkenés: <strong>{véCsökkenés}</strong></span>
          <button onClick={() => setVéCsökkenés(véCsökkenés + 1)}>+1</button>
          <button onClick={() => setVéCsökkenés(véCsökkenés + 2)}>+2</button>
          <button onClick={() => setVéCsökkenés(véCsökkenés + 3)}>+3</button>
          <button onClick={() => setVéCsökkenés(Math.max(0, véCsökkenés - 1))}>-1</button>
          <button onClick={() => setVéCsökkenés(0)}>⟲</button>
        </div>
      </div>

      <div className="harc-section">
        <EpTable ÉP={ep.ÉP} />
      </div>

      <div className="harc-section manover">
        <span>Manőver Alap: {manöverPont}</span>
        <span>MP: <strong>{Math.min(aktManöverPont, manöverPont)}</strong>/{manöverPont}</span>
        <button onClick={() => setAktManöverPont(Math.min(manöverPont, aktManöverPont + 1))}>+1</button>
        <button onClick={() => setAktManöverPont(Math.max(0, Math.min(aktManöverPont, manöverPont) - 1))}>-1</button>
      </div>
    </div>
  );
}

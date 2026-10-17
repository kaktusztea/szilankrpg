import { useState } from 'react';
import { rollElőnyHátrányDie, type ProbaDobás } from '../../engine/dice';
import { összetettCélszámok, összetettEredmény, összetettKéziFelirat, type ÖsszetettEredmény } from './proba-common';

interface Opciók {
  /** Tulajdonság [+ effektív szint] - a dobáshoz adódik. */
  bázis: number;
  ehSzint: number;
  kocka: number;
  nehézség: number | null;
  /** Összetett próba másodlagos dobásainak száma (0 = ki). */
  összetettDb: number;
  másodlagosLevonás: number;
  /** Minden lezárt dobás után (pl. Vállalás k6). */
  onDobott?: () => void;
  /** Reset után (pl. a Vállalás eredmény törlése). */
  onReset?: () => void;
}

/** Próba dobás-állapot: automatikus és kézi dobás, sima vagy összetett (1 elsődleges + N másodlagos). */
export function useProbaDobas({ bázis, ehSzint, kocka, nehézség, összetettDb, másodlagosLevonás, onDobott, onReset }: Opciók) {
  const [dobás, setDobás] = useState<ProbaDobás | null>(null);
  const [összetett, setÖsszetett] = useState<ÖsszetettEredmény | null>(null);
  const [kézi, setKézi] = useState<number[]>([]);
  const összetettAktív = összetettDb > 0 && nehézség !== null;

  const reset = () => { setDobás(null); setÖsszetett(null); setKézi([]); onReset?.(); };

  const lezár = (dobások: ProbaDobás[]) => {
    if (összetettAktív) {
      const e = összetettEredmény(bázis, dobások, összetettCélszámok(nehézség!, összetettDb, másodlagosLevonás));
      setÖsszetett(e);
      setDobás(e.sorok[0].dobás); // jelzi, hogy dobtunk
    } else {
      setDobás(dobások[0]);
    }
    setKézi([]);
    onDobott?.();
  };

  const dob = () => lezár(Array.from({ length: összetettAktív ? összetettDb + 1 : 1 }, () => rollElőnyHátrányDie(ehSzint, kocka)));

  const kéziDobás = (érték: number) => {
    const gyűjtött = [...kézi, érték];
    if (összetettAktív && gyűjtött.length < összetettDb + 1) { setKézi(gyűjtött); return; }
    lezár(gyűjtött.map(v => ({ rolls: [v], eredmény: v })));
  };

  return {
    dobás, összetett,
    vanEredmény: összetettDb > 0 ? összetett !== null : dobás !== null,
    kéziFolyamatban: kézi.length > 0,
    kéziFelirat: összetettKéziFelirat(összetettDb, kézi.length),
    reset, dob, kéziDobás,
  };
}

import type { Karakter } from '../engine/types';
import type { GameData } from '../engine/data-loader';
import type { PróbaEnyhítés } from '../engine/data-types';
import { képzKulcs, bontKépzKulcs } from '../engine/azonosito';
import { TulajdonsagProbaPopup } from './tulajdonsagok/TulajdonsagProbaPopup';
import { KepzettsegProbaPopup } from './tulajdonsagok/KepzettsegProbaPopup';
import { getDisplayName } from './tulajdonsagok/helpers';
import { fizikaiTulajdonság, type FelszerelésHátrány } from '../engine/felszereles';

/** Próba-hub cél: melyik próbát indítja a dispatcher. */
export type ProbaCél =
  | { típus: 'tulajdonság'; kulcs: string }
  | { típus: 'képzettség'; idx: number }
  | { típus: 'képzetlen' };

interface Props {
  cél: ProbaCél;
  data: GameData;
  karakter: Karakter;
  fortélyFokok: Record<string, number>;
  felszHátrány: FelszerelésHátrány;
  négáltKulcsok: ReadonlySet<string>;
  többszörösNevek: ReadonlySet<string>;
  fortélyBónuszByTul: Record<string, { érték: number; leírás: string }[]>;
  fortélyBónuszByKép: Record<string, { érték: number; leírás: string }[]>;
  próbaEnyhítésekByKép: Record<string, PróbaEnyhítés[]>;
  onClose: () => void;
}

/** A közös képzettségpróba-popup bekötése egy adott képzettség-kulcsra (felvett vagy képzetlen). */
function képzettségPopup(
  kulcs: string, szint: number, képzetlen: boolean,
  { data, karakter, fortélyFokok, felszHátrány, négáltKulcsok, többszörösNevek, fortélyBónuszByKép, próbaEnyhítésekByKép, onClose }: Props & { onClose: () => void },
) {
  const def = data.kepzettsegDefs.find(d => d.id === bontKépzKulcs(kulcs).id);
  if (!def) return null;
  const displayName = getDisplayName(kulcs, data.kepzettsegDefs);
  const kit = data.kiterjesztesek[kulcs] || [];
  const fortélyBónuszok = fortélyBónuszByKép[kulcs] ?? [];
  const fizikai = def.csoport === 'fizikai';
  return (
    <KepzettsegProbaPopup
      képzettségNév={displayName}
      képzettségKulcs={kulcs}
      kepzettsegDefs={data.kepzettsegDefs}
      képzettségCsoport={def.csoport}
      szint={szint}
      tulajdonságok={karakter.tulajdonságok}
      kiterjesztesek={kit}
      fortélyFokok={fortélyFokok}
      többszörösNevek={többszörösNevek}
      negáltKulcsok={négáltKulcsok}
      onToggleNegál={() => { /* a hubból nem szerkesztjük a negálást */ }}
      képzettségek={karakter.képzettségek}
      aktívStátuszok={karakter.session.aktív_státuszok}
      statuszDefs={data.statuszok}
      módosítóTáblák={[...(def.helyzetfüggő_módosítók || []),
        ...(fortélyBónuszok.length ? [{ kategória: 'Fortélyok', mód: 'multi' as const, sorok: fortélyBónuszok }] : [])]}
      próbaEnyhítések={próbaEnyhítésekByKép[kulcs] ?? []}
      dobásKomment={def.dobás_komment || []}
      felszEH={fizikai ? felszHátrány.ehSzint : 0}
      felszNemHarcol={fizikai ? felszHátrány.nemHarcol : false}
      próba={data.konstansok.próba}
      képzetlen={képzetlen}
      onClose={onClose}
    />
  );
}

export function ProbaDispatcher(props: Props) {
  const { cél, data, karakter, fortélyBónuszByTul, felszHátrány, onClose } = props;

  if (cél.típus === 'tulajdonság') {
    const név = cél.kulcs;
    const fizikai = fizikaiTulajdonság(név, data);
    return (
      <TulajdonsagProbaPopup
        tulajdonságNév={név}
        érték={karakter.tulajdonságok[név as keyof typeof karakter.tulajdonságok]}
        felszEH={fizikai ? felszHátrány.ehSzint : 0}
        fortélyBónuszok={fortélyBónuszByTul[név] ?? []}
        felszNemHarcol={fizikai ? felszHátrány.nemHarcol : false}
        próba={data.konstansok.próba}
        onClose={onClose}
      />
    );
  }

  if (cél.típus === 'képzettség') {
    const kp = karakter.képzettségek[cél.idx];
    if (!kp) { onClose(); return null; }
    return képzettségPopup(képzKulcs(kp), kp.szint, false, { ...props, onClose });
  }

  // Képzetlen próba: általános (képzettségtől független) - szint 0, k10 vs célszám, a +3-at a popup
  // belső "Fizikai képzettség" kapcsolója vezérli (KM dönti el; §030_06_01). Nincs képzettség-választó.
  return (
    <KepzettsegProbaPopup
      képzettségNév="Képzetlen próba"
      képzettségKulcs=""
      kepzettsegDefs={data.kepzettsegDefs}
      képzettségCsoport=""
      szint={0}
      tulajdonságok={karakter.tulajdonságok}
      kiterjesztesek={[]}
      fortélyFokok={props.fortélyFokok}
      többszörösNevek={props.többszörösNevek}
      negáltKulcsok={props.négáltKulcsok}
      onToggleNegál={() => { /* nincs képzettség - nincs negálás */ }}
      képzettségek={karakter.képzettségek}
      aktívStátuszok={karakter.session.aktív_státuszok}
      statuszDefs={data.statuszok}
      módosítóTáblák={[]}
      próbaEnyhítések={[]}
      dobásKomment={[]}
      felszEH={0}
      felszNemHarcol={false}
      próba={data.konstansok.próba}
      képzetlen
      képzetlenFizikaiToggle
      onClose={onClose}
    />
  );
}

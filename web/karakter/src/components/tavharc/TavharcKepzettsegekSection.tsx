import type { GameData } from '../../engine/data-loader';
import type { Karakter } from '../../engine/types';
import { képzKulcs, bontKépzKulcs, harcmodorNév } from '../../engine/azonosito';
import { getAllTávharciNames } from '../harcertekek/helpers';
import { HarcmodorLista, type HarcmodorListaProps } from '../harcertekek/HarcmodorLista';

type Props = Pick<HarcmodorListaProps, 'képzettségek' | 'setKépzettségek' | 'gameMode' | 'onDeleteKepz' | 'onKepzSzint'> & {
  data: GameData;
  karakter: Karakter;
};

const távharciFelirat = (kulcs: string) => `Távolsági harcmodor: ${harcmodorNév(bontKépzKulcs(kulcs).elem)}`;

export function TavharcKepzettsegekSection({ data, karakter, ...lista }: Props) {
  const kulcsok = getAllTávharciNames(data);
  if (lista.gameMode && !lista.képzettségek.some(kp => kulcsok.includes(képzKulcs(kp)) && kp.szint > 0)) return null;
  return (
    <section className="he-section th-kepz-section">
      <HarcmodorLista {...lista} kulcsok={kulcsok} felirat={távharciFelirat} felvételFelirat="+ Távolsági harcmodor..." tsz={karakter.tsz} />
    </section>
  );
}

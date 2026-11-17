import type { GameData } from '../../engine/data-loader';
import type { Karakter } from '../../engine/types';
import { getAllKözelharciNames, harciKepzDisplayName } from '../../engine/harc/harcertekek-helpers';
import { HarcmodorLista, type HarcmodorListaProps } from '../common/HarcmodorLista';

type Props = Pick<HarcmodorListaProps, 'képzettségek' | 'setKépzettségek' | 'gameMode' | 'onDeleteKepz' | 'onKepzSzint'> & {
  data: GameData;
  karakter: Karakter;
};

export function HarciKepzettsegekSection({ data, karakter, ...lista }: Props) {
  return (
    <section className="he-section">
      <HarcmodorLista {...lista} kulcsok={getAllKözelharciNames(data)} felirat={kulcs => harciKepzDisplayName(data, kulcs)}
        felvételFelirat="+ Harci képzettség..." fejléc="Harci képzettségek" tsz={karakter.tsz} />
    </section>
  );
}

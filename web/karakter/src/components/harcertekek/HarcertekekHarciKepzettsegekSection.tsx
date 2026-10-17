import type { GameData } from '../../engine/data-loader';
import type { Karakter } from '../../engine/types';
import { getAllKözelharciNames, harciKepzDisplayName } from './helpers';
import { HarcmodorLista, type HarcmodorListaProps } from './HarcmodorLista';

type Props = Pick<HarcmodorListaProps, 'képzettségek' | 'setKépzettségek' | 'gameMode' | 'onDeleteKepz' | 'onKepzSzint'> & {
  data: GameData;
  karakter: Karakter;
};

export function HarciKepzettsegekSection({ data, karakter, ...lista }: Props) {
  return (
    <section className="he-section">
      <h3>Harci képzettségek</h3>
      <HarcmodorLista {...lista} kulcsok={getAllKözelharciNames(data)} felirat={kulcs => harciKepzDisplayName(data, kulcs)}
        felvételFelirat="+ Harci képzettség..." tsz={karakter.tsz} />
    </section>
  );
}

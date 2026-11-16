import './common.css';

/** Flat colored dot (CSS, no emoji): the color code of the Tulajdonságok / Fortélyok / Hátterek tabs. Same on every platform. */
export function SzinKor({ szín }: { szín: 'kék' | 'lila' | 'sárga' }) {
  return <span className={`szin-kor szin-kor-${szín}`} aria-hidden="true" />;
}

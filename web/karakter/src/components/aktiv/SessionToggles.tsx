import type { AktivBaseProps } from './types';

export function SessionToggles({ data, karakter, session, setSession }: Pick<AktivBaseProps, 'data' | 'karakter' | 'session' | 'setSession'>) {
  const toggleForts = data.fortelySummaries.filter(d => d.session_toggle);
  return (
    <>
      {toggleForts.map(tf => {
        const has = karakter.fortélyok.some(f => f.név === tf.név && f.fok > 0);
        const sessionKey = tf.név.toLowerCase().replace(/ /g, '_');
        const active = (session as unknown as Record<string, unknown>)[sessionKey] as boolean ?? false;
        return (
          <div key={tf.név} className={`aktiv-field-btn aktiv-field-toggle ${active && has ? 'on' : ''} ${!has ? 'disabled' : ''}`}
            onClick={() => { if (has) setSession(s => ({ ...s, [sessionKey]: !active })); }}>
            <span className="aktiv-field-label">{tf.név.length > 14 ? tf.név.replace('Harci ', 'H. ') : tf.név}</span>
            <strong>{active && has ? 'Igen' : 'Nem'}</strong>
          </div>
        );
      })}
    </>
  );
}

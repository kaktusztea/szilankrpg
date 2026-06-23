export function describeKepChange(prev: { név: string; szint: number }[], next: { név: string; szint: number }[]): string {
  if (next.length > prev.length) {
    const added = next.find(n => !prev.some(k => k.név === n.név));
    if (added) return `Képzettség: ${added.név} 0→${added.szint}`;
  } else if (next.length < prev.length) {
    const removed = prev.find(k => !next.some(n => n.név === k.név));
    if (removed) return `Képzettség: ${removed.név} ${removed.szint}→0❌`;
  } else {
    const changed = next.find(n => { const old = prev.find(k => k.név === n.név); return old && old.szint !== n.szint; });
    if (changed) { const old = prev.find(k => k.név === changed.név)!; return `Képzettség: ${changed.név} ${old.szint}→${changed.szint}`; }
  }
  return '';
}

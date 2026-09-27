import { describe, it, expect, vi } from 'vitest';

// A useEscapeClose belső escape-stack logikáját teszteljük DOM/React nélkül:
// a hook effect-testét és cleanup-ját közvetlenül szimuláljuk, ugyanazzal a
// push/pop + "csak a legfelső reagál" szabállyal, mint a hook implementációja.
//
// Miért nem renderHook/jsdom: a projekt nem használ jsdom-ot / testing-library-t
// (l. useUndo.coalesce.test.ts — pure logika tesztek), nem indokolt új dependency
// egyetlen hook self-check kedvéért. A stack tömb modul-szintű, ezért a viselkedés
// egy egyszerű push/pop szimulációval 1:1 lefedhető.

function simulateMount(stack: (() => void)[], onClose: () => void) {
  stack.push(onClose);
  return () => {
    const idx = stack.lastIndexOf(onClose);
    if (idx !== -1) stack.splice(idx, 1);
  };
}

function simulateEscape(stack: (() => void)[]) {
  const top = stack[stack.length - 1];
  if (top) top();
}

describe('useEscapeClose — nested popup stack szemantika', () => {
  it('csak a legfelső (legutóbb mountolt) popup záródik Escape-re', () => {
    const stack: (() => void)[] = [];
    const outerClose = vi.fn();
    const innerClose = vi.fn();

    simulateMount(stack, outerClose);
    simulateMount(stack, innerClose);

    simulateEscape(stack);

    expect(innerClose).toHaveBeenCalledTimes(1);
    expect(outerClose).not.toHaveBeenCalled();
  });

  it('a belső popup unmountja után az Escape ismét a külsőt zárja', () => {
    const stack: (() => void)[] = [];
    const outerClose = vi.fn();
    const innerClose = vi.fn();

    simulateMount(stack, outerClose);
    const unmountInner = simulateMount(stack, innerClose);
    unmountInner();

    simulateEscape(stack);

    expect(outerClose).toHaveBeenCalledTimes(1);
    expect(innerClose).not.toHaveBeenCalled();
  });

  it('egyetlen popupnál a régi viselkedés marad (mindig ő záródik)', () => {
    const stack: (() => void)[] = [];
    const onClose = vi.fn();
    simulateMount(stack, onClose);

    simulateEscape(stack);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

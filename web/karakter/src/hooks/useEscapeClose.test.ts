import { describe, it, expect, vi } from 'vitest';

// A useEscapeClose belső escape-stack logikáját teszteljük DOM/React nélkül:
// a hook effect-testét és cleanup-ját közvetlenül szimuláljuk, ugyanazzal a
// STABIL TOKEN + ref szabállyal, mint a hook implementációja (NEM a hívó onClose
// függvény-referenciájával - l. a hook kommentjét).
//
// Miért nem renderHook/jsdom: a projekt nem használ jsdom-ot / testing-library-t
// (l. useUndo.coalesce.test.ts - pure logika tesztek), nem indokolt új dependency
// egyetlen hook self-check kedvéért. A stack tömb modul-szintű, ezért a viselkedés
// egy egyszerű push/pop szimulációval 1:1 lefedhető.

interface Mount {
  token: object;
  onCloseRef: { current: () => void };
}

function simulateMount(stack: object[], onClose: () => void): { mount: Mount; unmount: () => void } {
  const token = {};
  const onCloseRef = { current: onClose };
  stack.push(token);
  return {
    mount: { token, onCloseRef },
    unmount: () => {
      const idx = stack.lastIndexOf(token);
      if (idx !== -1) stack.splice(idx, 1);
    },
  };
}

function simulateEscape(stack: object[], mounts: Mount[]) {
  const top = stack[stack.length - 1];
  const m = mounts.find(x => x.token === top);
  if (m) m.onCloseRef.current();
}

describe('useEscapeClose - nested popup stack szemantika', () => {
  it('csak a legfelső (legutóbb mountolt) popup záródik Escape-re', () => {
    const stack: object[] = [];
    const outerClose = vi.fn();
    const innerClose = vi.fn();

    const outer = simulateMount(stack, outerClose);
    const inner = simulateMount(stack, innerClose);

    simulateEscape(stack, [outer.mount, inner.mount]);

    expect(innerClose).toHaveBeenCalledTimes(1);
    expect(outerClose).not.toHaveBeenCalled();
  });

  it('a belső popup unmountja után az Escape ismét a külsőt zárja', () => {
    const stack: object[] = [];
    const outerClose = vi.fn();
    const innerClose = vi.fn();

    const outer = simulateMount(stack, outerClose);
    const inner = simulateMount(stack, innerClose);
    inner.unmount();

    simulateEscape(stack, [outer.mount, inner.mount]);

    expect(outerClose).toHaveBeenCalledTimes(1);
    expect(innerClose).not.toHaveBeenCalled();
  });

  it('a token-azonosítás független az onClose referenciától (inline arrow újrarendereléskor)', () => {
    // Regresszió: korábban a stack a `top === onClose` REFERENCIÁT nézte. Az OverlayPortal-ok
    // inline `() => setX(false)` onClose-t kapnak, ami minden rendernél új referencia → a stack
    // tetejének azonosítása felborult, és Escape az egész overlay-láncot bezárta.
    const stack: object[] = [];
    const outerClose = vi.fn();
    let innerClose = vi.fn();

    const outer = simulateMount(stack, outerClose);
    const inner = simulateMount(stack, innerClose);

    // "Újrarenderelés": a belső onClose referenciája változik, de a token stabil marad,
    // és a hook a legfrissebb onClose-t a ref-ből hívja.
    innerClose = vi.fn();
    inner.mount.onCloseRef.current = innerClose;

    simulateEscape(stack, [outer.mount, inner.mount]);

    expect(innerClose).toHaveBeenCalledTimes(1);
    expect(outerClose).not.toHaveBeenCalled();
  });
});

import type { ComponentProps } from 'react';
import { OverlayPortal } from './OverlayPortal';
import { SlotList } from '../SlotList';

/** Karakterek hub overlay: a SlotList portálban, címmel (a propok 1:1 a SlotList-éi). */
export function SlotListOverlay(props: ComponentProps<typeof SlotList>) {
  return (
    <OverlayPortal dismissible onClose={props.onClose}>
      <div className="kep-prompt overlay-slots">
        <label className="overlay-label-center">Karakterek</label>
        <SlotList {...props} />
      </div>
    </OverlayPortal>
  );
}

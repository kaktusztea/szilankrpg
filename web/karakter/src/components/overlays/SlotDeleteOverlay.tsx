import { DeleteConfirmPopup } from '../DeleteConfirmPopup';

interface Props {
  név: string;
  onConfirm: () => void;
  onClose: () => void;
}

// Stacked confirm over the SlotList: its own backdrop click / Escape closes only this popup
// (OverlayPortal stops the propagation, so useOverlays' global handler does not close the SlotList).
export function SlotDeleteOverlay({ név, onConfirm, onClose }: Props) {
  return (
    <DeleteConfirmPopup
      label="Karakter törlése"
      leírás={`${név} végleg törlődik (a verzióival és a naplójával együtt).`}
      buttonText="Törlés"
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}

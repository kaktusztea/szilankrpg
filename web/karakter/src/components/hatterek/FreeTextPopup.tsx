import { SpecPicker } from '../SpecPicker';

interface FreeTextPopupProps {
  label: string;
  onConfirm: (text: string) => void;
  onClose: () => void;
}

export function FreeTextPopup({ label, onConfirm, onClose }: FreeTextPopupProps) {
  return <SpecPicker
    source={{ type: 'freetext', label, placeholder: 'Kiegészítő szöveg (max 20)', maxLength: 20 }}
    onSelect={onConfirm}
    onCancel={onClose}
  />;
}

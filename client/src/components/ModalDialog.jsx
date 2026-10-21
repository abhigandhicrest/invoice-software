/**
 * Keyboard-accessible modal: focus the first control, trap Tab, close on Escape (TC-UI-07).
 */
import { useEffect, useRef } from 'react';

export default function ModalDialog({
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
  confirmDisabled = false,
}) {
  const dialogRef = useRef(null);
  const titleId = 'modal-title';

  useEffect(() => {
    const node = dialogRef.current;
    const focusable = node?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable?.[0];
    first?.focus();

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
      if (event.key === 'Tab' && focusable && focusable.length > 0) {
        const items = Array.from(focusable);
        const currentIndex = items.indexOf(document.activeElement);
        if (event.shiftKey && (currentIndex <= 0)) {
          event.preventDefault();
          items[items.length - 1].focus();
        } else if (!event.shiftKey && currentIndex === items.length - 1) {
          event.preventDefault();
          items[0].focus();
        }
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="dialog-backdrop no-print" onClick={onClose}>
      <div
        ref={dialogRef}
        className="dialog-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="h5 mb-3">{title}</h2>
        <div className="mb-4">{children}</div>
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
            {cancelLabel}
          </button>
          <button type="button" className="btn btn-accent" onClick={onConfirm} disabled={confirmDisabled}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

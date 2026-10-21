/**
 * Accessible labeled control. Errors use aria-invalid and aria-describedby
 * so they are not communicated by color alone (TC-UI-06).
 */
import { cloneElement, isValidElement } from 'react';

export default function FormField({
  id,
  label,
  error,
  required = false,
  hint,
  children,
  className = 'mb-3',
}) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  const control = isValidElement(children)
    ? cloneElement(children, {
      id,
      'aria-invalid': error ? 'true' : 'false',
      'aria-describedby': describedBy,
      'aria-required': required || undefined,
      className: `${children.props.className || 'form-control'} ${error ? 'is-invalid' : ''}`.trim(),
    })
    : children;

  return (
    <div className={className}>
      <label htmlFor={id} className="form-label">
        {label}
        {required ? <span className="text-danger" aria-hidden="true"> *</span> : null}
      </label>
      {control}
      {hint ? <div id={hintId} className="form-text">{hint}</div> : null}
      {error ? <div id={errorId} className="invalid-feedback d-block">{error}</div> : null}
    </div>
  );
}

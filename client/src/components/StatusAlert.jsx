/** Page-level status/alert. Optional href is used for extra recovery links. */
export default function StatusAlert({ type = 'info', message, href, hrefLabel = 'Open link', onDismiss }) {
  if (!message) {
    return null;
  }

  const role = type === 'danger' ? 'alert' : 'status';
  return (
    <div className={`alert alert-${type} status-banner d-flex justify-content-between align-items-start`} role={role}>
      <div>
        <p className="mb-0">{message}</p>
        {href ? (
          <p className="mb-0 mt-2">
            <a href={href} target="_blank" rel="noreferrer">{hrefLabel}</a>
          </p>
        ) : null}
      </div>
      {onDismiss ? (
        <button type="button" className="btn-close" aria-label="Dismiss message" onClick={onDismiss} />
      ) : null}
    </div>
  );
}

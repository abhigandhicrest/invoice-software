/** Editor chrome. Hidden in print via `.no-print` / `.app-header` (TC-UI-08). */
import { Link } from 'react-router-dom';

export default function AppHeader({
  onSave,
  onPrint,
  onEmail,
  saving = false,
  disableEmail = false,
}) {
  return (
    <header className="app-header no-print sticky-top">
      <div className="container-fluid py-3 px-3 px-lg-4">
        <div className="d-flex flex-column flex-lg-row gap-3 align-items-lg-center justify-content-between">
          <div>
            <Link to="/invoices" className="text-decoration-none text-reset">
              <h1 className="h4 mb-0">Invoice Editor</h1>
            </Link>
            <p className="text-muted small mb-0">Create, preview, and send professional invoices.</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Link to="/invoices/new" className="btn btn-outline-accent">New Invoice</Link>
            <button type="submit" form="invoice-form" className="btn btn-accent" onClick={onSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Invoice'}
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={onPrint}>
              Preview / Print
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={onEmail} disabled={disableEmail}>
              Send Email
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

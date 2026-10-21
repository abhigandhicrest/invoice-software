/**
 * Paginated invoice list with open/delete actions, loading, empty, and error
 * states (TC-UI-05).
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteInvoice, getApiErrorMessage, listInvoices } from '../api/client.js';
import { formatDate, formatUsdFromCents } from '@shared/format.js';
import ModalDialog from '../components/ModalDialog.jsx';
import StatusAlert from '../components/StatusAlert.jsx';

export default function InvoiceListPage() {
  const [data, setData] = useState({ items: [], page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load(nextPage = page) {
    setLoading(true);
    setError('');
    try {
      const response = await listInvoices({ page: nextPage, limit: 10 });
      setData(response.data.data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(page);
  }, [page]);

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }
    setBusy(true);
    try {
      await deleteInvoice(pendingDelete.id);
      setPendingDelete(null);
      await load(page);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-vh-100">
      <header className="app-header no-print">
        <div className="container py-4">
          <div className="d-flex flex-column flex-md-row justify-content-between gap-3 align-items-md-center">
            <div>
              <h1 className="h3 mb-1">Invoice Editor</h1>
              <p className="text-muted mb-0">Saved invoices for Harbor Lane Studio.</p>
            </div>
            <div className="d-flex gap-2">
              <Link to="/invoices/new" className="btn btn-accent">New Invoice</Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-4">
        <StatusAlert type="danger" message={error} onDismiss={() => setError('')} />
        <div className="section-card p-3 p-md-4">
          {loading ? <p className="mb-0">Loading invoices…</p> : null}
          {!loading && data.items.length === 0 ? (
            <div className="text-center py-5">
              <p className="mb-3">No invoices have been saved yet.</p>
              <Link to="/invoices/new" className="btn btn-accent">Create the first invoice</Link>
            </div>
          ) : null}
          {!loading && data.items.length > 0 ? (
            <>
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th scope="col">Invoice number</th>
                      <th scope="col">Customer</th>
                      <th scope="col">Issue date</th>
                      <th scope="col" className="text-end">Grand total</th>
                      <th scope="col" className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((invoice) => (
                      <tr key={invoice.id}>
                        <td>{invoice.invoiceNumber}</td>
                        <td>{invoice.customerName}</td>
                        <td>{formatDate(invoice.issueDate)}</td>
                        <td className="text-end">{formatUsdFromCents(invoice.grandTotalCents)}</td>
                        <td className="text-end">
                          <Link className="btn btn-sm btn-outline-accent me-2" to={`/invoices/${invoice.id}`}>
                            Open
                          </Link>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => setPendingDelete(invoice)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <p className="small text-muted mb-0">{data.total} invoice{data.total === 1 ? '' : 's'}</p>
                <div className="btn-group">
                  <button type="button" className="btn btn-outline-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    Previous
                  </button>
                  <button type="button" className="btn btn-outline-secondary btn-sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </main>

      {pendingDelete ? (
        <ModalDialog
          title="Delete invoice"
          confirmLabel={busy ? 'Deleting…' : 'Delete'}
          confirmDisabled={busy}
          onConfirm={confirmDelete}
          onClose={() => setPendingDelete(null)}
        >
          <p className="mb-0">
            Delete {pendingDelete.invoiceNumber} for {pendingDelete.customerName}? This cannot be undone.
          </p>
        </ModalDialog>
      ) : null}
    </div>
  );
}

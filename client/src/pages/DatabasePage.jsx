/**
 * Heidi-style table of the MongoDB invoices collection.
 * HeidiSQL cannot open MongoDB (it is a MySQL/MariaDB client).
 */
import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiErrorMessage, inspectDatabase } from '../api/client.js';
import { formatUsdFromCents } from '@shared/format.js';
import StatusAlert from '../components/StatusAlert.jsx';

export default function DatabasePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState('');

  useEffect(() => {
    inspectDatabase()
      .then((response) => setData(response.data.data))
      .catch((err) => setError(getApiErrorMessage(err)));
  }, []);

  return (
    <div className="min-vh-100">
      <header className="app-header no-print">
        <div className="container py-4">
          <div className="d-flex flex-column flex-md-row justify-content-between gap-3 align-items-md-center">
            <div>
              <h1 className="h3 mb-1">MongoDB viewer</h1>
              <p className="text-muted mb-0">
                HeidiSQL is for MySQL. This screen shows the MongoDB collection the same way: database, table, rows.
              </p>
            </div>
            <div className="d-flex gap-2">
              <Link to="/invoices" className="btn btn-outline-accent">Invoices</Link>
              <Link to="/invoices/new" className="btn btn-accent">New Invoice</Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-4">
        <StatusAlert type="danger" message={error} onDismiss={() => setError('')} />
        {!data && !error ? <p>Loading collection…</p> : null}
        {data ? (
          <>
            <div className="section-card p-3 p-md-4 mb-3">
              <div className="table-responsive">
                <table className="table table-sm mb-0">
                  <tbody>
                    <tr><th scope="row">Engine</th><td>{data.engine}</td></tr>
                    <tr><th scope="row">Host</th><td>{data.host}{data.port ? `:${data.port}` : ''}</td></tr>
                    <tr><th scope="row">Database</th><td>{data.database}</td></tr>
                    <tr><th scope="row">Collection (table)</th><td>{data.collection}</td></tr>
                    <tr><th scope="row">Rows</th><td>{data.count}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="section-card p-3 p-md-4">
              <h2 className="h5 mb-3">{data.collection}</h2>
              {data.documents.length === 0 ? (
                <p className="mb-0 text-muted">The collection is empty. Save an invoice first.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th scope="col">_id</th>
                        <th scope="col">invoiceNumber</th>
                        <th scope="col">customer</th>
                        <th scope="col">issueDate</th>
                        <th scope="col" className="text-end">grandTotalCents</th>
                        <th scope="col" className="text-end">grand total</th>
                        <th scope="col">JSON</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.documents.map((doc) => {
                        const id = String(doc._id);
                        return (
                          <Fragment key={id}>
                            <tr>
                              <td className="small">{id}</td>
                              <td>{doc.invoiceNumber}</td>
                              <td>{doc.customerDetails?.name}</td>
                              <td>{doc.issueDate}</td>
                              <td className="text-end">{doc.grandTotalCents}</td>
                              <td className="text-end">{formatUsdFromCents(doc.grandTotalCents)}</td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => setOpenId(openId === id ? '' : id)}
                                >
                                  {openId === id ? 'Hide' : 'View'}
                                </button>
                              </td>
                            </tr>
                            {openId === id ? (
                              <tr>
                                <td colSpan="7">
                                  <pre className="small mb-0 bg-light p-3 rounded">{JSON.stringify(doc, null, 2)}</pre>
                                </td>
                              </tr>
                            ) : null}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}

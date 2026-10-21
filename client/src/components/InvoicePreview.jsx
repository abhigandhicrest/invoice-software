/**
 * Live invoice document. Hidden custom fields are omitted here so they also
 * stay out of print (TC-CF-06, TC-UI-10). Totals come from tryCalculateInvoice
 * so typing invalid numbers does not crash the preview.
 */
import { formatDate, formatQuantity, formatTaxRate, formatUsdFromCents } from '@shared/format.js';
import { getVisibleCustomFields } from '@shared/customFields.js';
import { tryCalculateInvoice } from '@shared/invoiceMath.js';

function Multiline({ value }) {
  if (!value) {
    return null;
  }
  return (
    <p className="preview-wrap mb-0">
      {String(value).split(/\r\n|\n|\r/).map((line, index, lines) => (
        <span key={`${line}-${index}`}>
          {line}
          {index < lines.length - 1 ? <br /> : null}
        </span>
      ))}
    </p>
  );
}

export default function InvoicePreview({ invoice }) {
  const values = invoice || {};
  const totals = tryCalculateInvoice(values);
  const visibleFields = getVisibleCustomFields(values.customFields);
  const business = values.businessDetails || {};
  const customer = values.customerDetails || {};
  const items = Array.isArray(values.lineItems) ? values.lineItems : [];

  return (
    <article id="invoice-preview" className="invoice-preview p-4 p-md-5" aria-label="Invoice preview">
      <header className="d-flex flex-column flex-md-row justify-content-between gap-4 mb-4">
        <div>
          <p className="text-uppercase small text-muted mb-1">Invoice</p>
          <h2 className="h3 preview-serif preview-wrap mb-2">{values.invoiceNumber || 'Draft invoice'}</h2>
          {values.issueDate ? <p className="mb-0">Issued {formatDate(values.issueDate)}</p> : null}
          {values.dueDate ? <p className="mb-0">Due {formatDate(values.dueDate)}</p> : null}
        </div>
        <div className="text-md-end">
          {business.name ? <p className="fw-semibold preview-wrap mb-1">{business.name}</p> : null}
          {business.address ? <Multiline value={business.address} /> : null}
          {business.email ? <p className="preview-wrap mb-0">{business.email}</p> : null}
          {business.phone ? <p className="preview-wrap mb-0">{business.phone}</p> : null}
          {business.website ? <p className="preview-wrap mb-0">{business.website}</p> : null}
          {business.taxId ? <p className="preview-wrap mb-0">Tax ID {business.taxId}</p> : null}
        </div>
      </header>

      <section className="mb-4">
        <p className="text-uppercase small text-muted mb-1">Bill to</p>
        {customer.name ? <p className="fw-semibold preview-wrap mb-1">{customer.name}</p> : <p className="text-muted mb-1">Customer name</p>}
        {customer.companyName ? <p className="preview-wrap mb-0">{customer.companyName}</p> : null}
        {customer.billingAddress ? <Multiline value={customer.billingAddress} /> : null}
        {customer.email ? <p className="preview-wrap mb-0">{customer.email}</p> : null}
        {customer.phone ? <p className="preview-wrap mb-0">{customer.phone}</p> : null}
        {customer.taxId ? <p className="preview-wrap mb-0">Tax ID {customer.taxId}</p> : null}
      </section>

      {visibleFields.length > 0 ? (
        <section className="preview-custom-fields mb-4">
          <div className="row">
            {visibleFields.map((field) => (
              <div key={`${field.label}-${field.value}`} className="col-md-6 mb-2">
                <p className="small text-muted mb-0">{field.label}</p>
                <p className="preview-wrap mb-0">{field.value || '—'}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="table-responsive mb-4">
        <table className="table invoice-table mb-0">
          <thead>
            <tr>
              <th scope="col">Description</th>
              <th scope="col" className="text-end">Qty</th>
              <th scope="col" className="text-end">Unit price</th>
              <th scope="col" className="text-end">Line total</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-muted">No line items yet.</td>
              </tr>
            ) : items.map((item, index) => (
              <tr key={`${item.description}-${index}`}>
                <td className="preview-wrap">{item.description || 'Untitled item'}</td>
                <td className="text-end">{formatQuantity(totals.lineItems[index]?.quantity ?? item.quantity)}</td>
                <td className="text-end">{formatUsdFromCents(totals.lineItems[index]?.unitPriceCents || 0)}</td>
                <td className="text-end">{formatUsdFromCents(totals.lineItems[index]?.lineTotalCents || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="preview-totals ms-auto" style={{ maxWidth: '18rem' }}>
        <div className="d-flex justify-content-between">
          <span>Subtotal</span>
          <span>{formatUsdFromCents(totals.subtotalCents)}</span>
        </div>
        <div className="d-flex justify-content-between">
          <span>Discount</span>
          <span>{formatUsdFromCents(totals.discountAmountCents)}</span>
        </div>
        <div className="d-flex justify-content-between">
          <span>Tax ({formatTaxRate(totals.taxRate)})</span>
          <span>{formatUsdFromCents(totals.taxAmountCents)}</span>
        </div>
        <div className="d-flex justify-content-between fw-semibold border-top pt-2 mt-2">
          <span>Grand total</span>
          <span>{formatUsdFromCents(totals.grandTotalCents)}</span>
        </div>
      </section>

      {values.notes ? (
        <section className="preview-notes mt-4">
          <p className="text-uppercase small text-muted mb-1">Notes</p>
          <Multiline value={values.notes} />
        </section>
      ) : null}
    </article>
  );
}

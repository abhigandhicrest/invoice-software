/**
 * Fixed USD discount and percentage tax. Discount cannot exceed subtotal
 * and tax is applied after the discount (TC-CALC-02, TC-CALC-08).
 */
import { useFormContext, useWatch } from 'react-hook-form';
import { formatTaxRate, formatUsdFromCents } from '@shared/format.js';
import { tryCalculateInvoice } from '@shared/invoiceMath.js';
import FormField from './FormField.jsx';

export default function TotalsEditor() {
  const { control, register, formState: { errors } } = useFormContext();
  const watched = useWatch({ control });
  const totals = tryCalculateInvoice(watched || {});

  return (
    <section className="section-card p-3 p-md-4 mb-3" aria-labelledby="totals-heading">
      <h2 id="totals-heading" className="section-title">Discount and tax</h2>
      <div className="row">
        <div className="col-md-6">
          <FormField id="discount-amount" label="Fixed discount (USD)" error={errors.discountAmount?.message}>
            <input type="number" min="0" step="0.01" className="form-control" {...register('discountAmount')} />
          </FormField>
        </div>
        <div className="col-md-6">
          <FormField id="tax-rate" label="Tax rate (%)" error={errors.taxRate?.message}>
            <input type="number" min="0" max="100" step="0.0001" className="form-control" {...register('taxRate')} />
          </FormField>
        </div>
      </div>
      <dl className="row mb-0">
        <dt className="col-6">Subtotal</dt>
        <dd className="col-6 text-end">{formatUsdFromCents(totals.subtotalCents)}</dd>
        <dt className="col-6">Discount</dt>
        <dd className="col-6 text-end">{formatUsdFromCents(totals.discountAmountCents)}</dd>
        <dt className="col-6">Tax ({formatTaxRate(totals.taxRate)})</dt>
        <dd className="col-6 text-end">{formatUsdFromCents(totals.taxAmountCents)}</dd>
        <dt className="col-6">Grand total</dt>
        <dd className="col-6 text-end fw-semibold">{formatUsdFromCents(totals.grandTotalCents)}</dd>
      </dl>
    </section>
  );
}

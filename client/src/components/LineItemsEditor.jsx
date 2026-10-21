/**
 * Line items with inline edit, add, and remove. Line totals are calculated
 * locally from shared invoiceMath, not from a backend round-trip.
 */
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { tryCalculateInvoice } from '@shared/invoiceMath.js';
import { formatUsdFromCents } from '@shared/format.js';
import { createEmptyLineItem } from '@shared/invoiceDefaults.js';
import FormField from './FormField.jsx';

export default function LineItemsEditor() {
  const { control, register, formState: { errors } } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });
  const lineItems = useWatch({ control, name: 'lineItems' }) || [];
  const totals = tryCalculateInvoice({ lineItems, discountAmount: 0, taxRate: 0 });

  return (
    <section className="section-card p-3 p-md-4 mb-3" aria-labelledby="line-items-heading">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 id="line-items-heading" className="section-title mb-0">Line items</h2>
        <button type="button" className="btn btn-outline-accent btn-sm" onClick={() => append(createEmptyLineItem())}>
          Add item
        </button>
      </div>
      {errors.lineItems?.message ? <p className="text-danger small">{errors.lineItems.message}</p> : null}
      <div className="d-flex flex-column gap-3">
        {fields.map((field, index) => {
          const lineError = errors.lineItems?.[index] || {};
          return (
            <div key={field.id} className="border rounded-3 p-3">
              <div className="row g-3 align-items-end">
                <div className="col-lg-5">
                  <FormField
                    id={`line-${index}-description`}
                    label="Description"
                    required
                    className="mb-0"
                    error={lineError.description?.message}
                  >
                    <input className="form-control" {...register(`lineItems.${index}.description`)} />
                  </FormField>
                </div>
                <div className="col-6 col-lg-2">
                  <FormField
                    id={`line-${index}-quantity`}
                    label="Quantity"
                    required
                    className="mb-0"
                    error={lineError.quantity?.message}
                  >
                    <input
                      type="number"
                      min="0.0001"
                      step="0.0001"
                      className="form-control"
                      {...register(`lineItems.${index}.quantity`)}
                    />
                  </FormField>
                </div>
                <div className="col-6 col-lg-2">
                  <FormField
                    id={`line-${index}-price`}
                    label="Unit price (USD)"
                    required
                    className="mb-0"
                    error={lineError.unitPrice?.message}
                  >
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="form-control"
                      {...register(`lineItems.${index}.unitPrice`)}
                    />
                  </FormField>
                </div>
                <div className="col-6 col-lg-2">
                  <p className="form-label mb-1">Line total</p>
                  <p className="mb-0 fw-semibold">
                    {formatUsdFromCents(totals.lineItems[index]?.lineTotalCents || 0)}
                  </p>
                </div>
                <div className="col-6 col-lg-1">
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => remove(index)}
                    aria-label={`Remove line item ${index + 1}`}
                    disabled={fields.length === 1}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

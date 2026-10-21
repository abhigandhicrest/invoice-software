import { useFormContext } from 'react-hook-form';
import FormField from './FormField.jsx';

/** Invoice number, issue/due dates (due cannot precede issue), and notes. */
export default function InvoiceInfoForm() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <section className="section-card p-3 p-md-4 mb-3" aria-labelledby="invoice-info-heading">
      <h2 id="invoice-info-heading" className="section-title">Invoice information</h2>
      <div className="row">
        <div className="col-md-4">
          <FormField id="invoice-number" label="Invoice number" required error={errors.invoiceNumber?.message}>
            <input className="form-control" {...register('invoiceNumber')} />
          </FormField>
        </div>
        <div className="col-md-4">
          <FormField id="issue-date" label="Issue date" required error={errors.issueDate?.message}>
            <input type="date" className="form-control" {...register('issueDate')} />
          </FormField>
        </div>
        <div className="col-md-4">
          <FormField id="due-date" label="Due date" required error={errors.dueDate?.message}>
            <input type="date" className="form-control" {...register('dueDate')} />
          </FormField>
        </div>
        <div className="col-12">
          <FormField id="invoice-notes" label="Notes" error={errors.notes?.message}>
            <textarea className="form-control" rows="4" {...register('notes')} />
          </FormField>
        </div>
      </div>
    </section>
  );
}

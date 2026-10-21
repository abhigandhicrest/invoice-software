import { useFormContext } from 'react-hook-form';
import FormField from './FormField.jsx';

/** Name and billing address are required; email is validated when provided. */
export default function CustomerDetailsForm() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <section className="section-card p-3 p-md-4 mb-3" aria-labelledby="customer-heading">
      <h2 id="customer-heading" className="section-title">Customer details</h2>
      <div className="row">
        <div className="col-md-6">
          <FormField id="customer-name" label="Customer name" required error={errors.customerDetails?.name?.message}>
            <input className="form-control" autoComplete="name" {...register('customerDetails.name')} />
          </FormField>
        </div>
        <div className="col-md-6">
          <FormField id="customer-email" label="Customer email" error={errors.customerDetails?.email?.message}>
            <input type="email" className="form-control" autoComplete="email" {...register('customerDetails.email')} />
          </FormField>
        </div>
        <div className="col-md-6">
          <FormField id="customer-company" label="Customer company" error={errors.customerDetails?.companyName?.message}>
            <input className="form-control" {...register('customerDetails.companyName')} />
          </FormField>
        </div>
        <div className="col-md-6">
          <FormField id="customer-phone" label="Customer phone" error={errors.customerDetails?.phone?.message}>
            <input type="tel" className="form-control" {...register('customerDetails.phone')} />
          </FormField>
        </div>
        <div className="col-md-6">
          <FormField id="customer-tax" label="Customer tax ID" error={errors.customerDetails?.taxId?.message}>
            <input className="form-control" {...register('customerDetails.taxId')} />
          </FormField>
        </div>
        <div className="col-md-6">
          <FormField id="customer-address" label="Customer billing address" required error={errors.customerDetails?.billingAddress?.message}>
            <textarea className="form-control" rows="3" {...register('customerDetails.billingAddress')} />
          </FormField>
        </div>
      </div>
    </section>
  );
}

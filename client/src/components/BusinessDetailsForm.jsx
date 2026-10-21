import { useFormContext } from 'react-hook-form';
import FormField from './FormField.jsx';

/** Editable seller block. Blank optional fields are omitted from the preview. */
export default function BusinessDetailsForm() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <section className="section-card p-3 p-md-4 mb-3" aria-labelledby="business-heading">
      <h2 id="business-heading" className="section-title">Business details</h2>
      <div className="row">
        <div className="col-md-6">
          <FormField id="business-name" label="Business name" required error={errors.businessDetails?.name?.message}>
            <input className="form-control" autoComplete="organization" {...register('businessDetails.name')} />
          </FormField>
        </div>
        <div className="col-md-6">
          <FormField id="business-email" label="Business email" error={errors.businessDetails?.email?.message}>
            <input type="email" className="form-control" autoComplete="email" {...register('businessDetails.email')} />
          </FormField>
        </div>
        <div className="col-md-6">
          <FormField id="business-phone" label="Business phone" error={errors.businessDetails?.phone?.message}>
            <input type="tel" className="form-control" autoComplete="tel" {...register('businessDetails.phone')} />
          </FormField>
        </div>
        <div className="col-md-6">
          <FormField id="business-website" label="Business website" error={errors.businessDetails?.website?.message}>
            <input type="url" className="form-control" placeholder="https://" {...register('businessDetails.website')} />
          </FormField>
        </div>
        <div className="col-md-6">
          <FormField id="business-tax" label="Business tax ID" error={errors.businessDetails?.taxId?.message}>
            <input className="form-control" {...register('businessDetails.taxId')} />
          </FormField>
        </div>
        <div className="col-md-6">
          <FormField id="business-address" label="Business address" error={errors.businessDetails?.address?.message}>
            <textarea className="form-control" rows="3" {...register('businessDetails.address')} />
          </FormField>
        </div>
      </div>
    </section>
  );
}

/**
 * Add / edit / hide / show / remove custom fields. The visibility checkbox
 * only changes presentation; unchecking does not clear the value (TC-CF-03).
 */
import { useFieldArray, useFormContext } from 'react-hook-form';
import { createCustomField } from '@shared/customFields.js';
import FormField from './FormField.jsx';

export default function CustomFieldsEditor() {
  const { control, register, formState: { errors } } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'customFields' });

  return (
    <section className="section-card p-3 p-md-4 mb-3" aria-labelledby="custom-fields-heading">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 id="custom-fields-heading" className="section-title mb-0">Custom fields</h2>
        <button type="button" className="btn btn-outline-accent btn-sm" onClick={() => append(createCustomField())}>
          Add custom field
        </button>
      </div>
      <p className="text-muted small">Hidden fields stay saved but are not shown on the preview, printout, or email.</p>
      {fields.length === 0 ? <p className="mb-0 text-muted">No custom fields yet.</p> : null}
      <div className="d-flex flex-column gap-3">
        {fields.map((field, index) => {
          const fieldError = errors.customFields?.[index] || {};
          return (
            <div key={field.id} className="border rounded-3 p-3">
              <div className="row g-3 align-items-end">
                <div className="col-md-4">
                  <FormField
                    id={`custom-${index}-label`}
                    label="Label"
                    required
                    className="mb-0"
                    error={fieldError.label?.message}
                  >
                    <input className="form-control" {...register(`customFields.${index}.label`)} />
                  </FormField>
                </div>
                <div className="col-md-4">
                  <FormField
                    id={`custom-${index}-value`}
                    label="Value"
                    className="mb-0"
                    error={fieldError.value?.message}
                  >
                    <input className="form-control" {...register(`customFields.${index}.value`)} />
                  </FormField>
                </div>
                <div className="col-md-2">
                  <div className="form-check mt-4">
                    <input
                      id={`custom-${index}-visible`}
                      type="checkbox"
                      className="form-check-input"
                      {...register(`customFields.${index}.visible`)}
                    />
                    <label htmlFor={`custom-${index}-visible`} className="form-check-label">
                      Visible on invoice
                    </label>
                  </div>
                </div>
                <div className="col-md-2">
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => remove(index)}
                    aria-label={`Remove custom field ${index + 1}`}
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

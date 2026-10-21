/**
 * Invoice editor: form on the left, live preview on the right (TC-UI-01).
 * Preview uses form state only — no autosave and no request per keystroke (TC-UI-03).
 * First save POSTs; later saves PUT to the returned id (TC-API-14).
 */
import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { isValidEmail } from '@shared/validation.js';
import {
  createInvoice,
  getApiErrorMessage,
  getApiFieldErrors,
  getInvoice,
  sendInvoiceEmail,
  updateInvoice,
} from '../api/client.js';
import AppHeader from '../components/AppHeader.jsx';
import BusinessDetailsForm from '../components/BusinessDetailsForm.jsx';
import CustomFieldsEditor from '../components/CustomFieldsEditor.jsx';
import CustomerDetailsForm from '../components/CustomerDetailsForm.jsx';
import InvoiceInfoForm from '../components/InvoiceInfoForm.jsx';
import InvoicePreview from '../components/InvoicePreview.jsx';
import LineItemsEditor from '../components/LineItemsEditor.jsx';
import ModalDialog from '../components/ModalDialog.jsx';
import StatusAlert from '../components/StatusAlert.jsx';
import TotalsEditor from '../components/TotalsEditor.jsx';
import { applyValidationErrors, createBlankInvoice, invoiceToFormValues } from '../utils/formHelpers.js';

export default function InvoiceEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const methods = useForm({
    defaultValues: createBlankInvoice(),
    mode: 'onBlur',
  });
  const values = useWatch({ control: methods.control });
  const [savedId, setSavedId] = useState(id && id !== 'new' ? id : null);
  const [layout, setLayout] = useState('edit');
  const [loading, setLoading] = useState(Boolean(id && id !== 'new'));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: 'info', message: '', href: '' });
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id || id === 'new') {
        methods.reset(createBlankInvoice());
        setSavedId(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await getInvoice(id);
        if (cancelled) {
          return;
        }
        const invoice = response.data.data;
        methods.reset(invoiceToFormValues(invoice));
        setSavedId(invoice.id);
        setEmailTo(invoice.customerDetails?.email || '');
      } catch (error) {
        if (!cancelled) {
          setStatus({ type: 'danger', message: getApiErrorMessage(error) });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, methods]);

  const previewValues = useMemo(() => values || createBlankInvoice(), [values]);

  function focusField(name) {
    const escaped = name.replace(/\./g, '\\.');
    const node = document.getElementById(name)
      || document.querySelector(`[name="${name}"]`)
      || document.getElementById(escaped);
    if (node?.focus) {
      node.focus();
      return;
    }

    const mapped = {
      'businessDetails.name': 'business-name',
      'businessDetails.email': 'business-email',
      'customerDetails.name': 'customer-name',
      'customerDetails.email': 'customer-email',
      'customerDetails.billingAddress': 'customer-address',
      invoiceNumber: 'invoice-number',
      issueDate: 'issue-date',
      dueDate: 'due-date',
      discountAmount: 'discount-amount',
      taxRate: 'tax-rate',
    };
    document.getElementById(mapped[name])?.focus();
  }

  async function handleSave(formValues) {
    methods.clearErrors();
    const errors = applyValidationErrors(methods.setError, formValues);
    if (errors.length > 0) {
      focusField(errors[0].field);
      setStatus({ type: 'danger', message: 'Please correct the highlighted fields before saving.' });
      return null;
    }

    setSaving(true);
    setStatus({ type: 'info', message: '' });
    try {
      const response = savedId
        ? await updateInvoice(savedId, formValues)
        : await createInvoice(formValues);
      const invoice = response.data.data;
      methods.reset(invoiceToFormValues(invoice));
      setSavedId(invoice.id);
      setEmailTo(invoice.customerDetails?.email || emailTo);
      if (!savedId) {
        navigate(`/invoices/${invoice.id}`, { replace: true });
      }
      setStatus({ type: 'success', message: `Invoice ${invoice.invoiceNumber} saved.` });
      return invoice;
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error);
      fieldErrors.forEach((item) => {
        methods.setError(item.field, { type: 'server', message: item.message });
      });
      if (fieldErrors[0]) {
        focusField(fieldErrors[0].field);
      }
      setStatus({ type: 'danger', message: getApiErrorMessage(error) });
      return null;
    } finally {
      setSaving(false);
    }
  }

  function handlePrint() {
    // Browser print / Save as PDF. CSS hides everything except the preview.
    window.print();
  }

  function handleEmail() {
    if (!savedId) {
      setStatus({ type: 'danger', message: 'Save the invoice before sending email.' });
      return;
    }
    setEmailTo((current) => current || methods.getValues('customerDetails.email') || 'abhi.gandhi@crestinfosystems.com');
    setEmailOpen(true);
  }

  async function confirmEmail() {
    if (!isValidEmail(emailTo)) {
      setStatus({ type: 'danger', message: 'Enter a valid recipient email address.' });
      return;
    }
    setSending(true);
    try {
      const response = await sendInvoiceEmail(savedId, emailTo.trim());
      setEmailOpen(false);
      setStatus({
        type: 'success',
        message: response.data.data.notice,
      });
    } catch (error) {
      setStatus({ type: 'danger', message: getApiErrorMessage(error) });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={`min-vh-100 layout-${layout}`}>
      <FormProvider {...methods}>
        <AppHeader
          saving={saving}
          disableEmail={!savedId}
          onPrint={handlePrint}
          onEmail={handleEmail}
        />
        <main className="container-fluid py-4 px-3 px-lg-4">
          <StatusAlert
            type={status.type}
            message={status.message}
            href={status.href}
            hrefLabel={status.hrefLabel}
            onDismiss={() => setStatus({ type: 'info', message: '', href: '' })}
          />
          {loading ? <p>Loading invoice…</p> : null}
          <div className="mobile-view-toggle d-lg-none no-print btn-group mb-3" role="group" aria-label="Editor views">
            <button
              type="button"
              className={`btn ${layout === 'edit' ? 'btn-accent' : 'btn-outline-accent'}`}
              onClick={() => setLayout('edit')}
            >
              Edit
            </button>
            <button
              type="button"
              className={`btn ${layout === 'preview' ? 'btn-accent' : 'btn-outline-accent'}`}
              onClick={() => setLayout('preview')}
            >
              Preview
            </button>
          </div>
          <div className="row g-4">
            <div className="col-lg-6 editor-pane">
              <form id="invoice-form" onSubmit={methods.handleSubmit(handleSave)} noValidate>
                <BusinessDetailsForm />
                <CustomerDetailsForm />
                <InvoiceInfoForm />
                <LineItemsEditor />
                <TotalsEditor />
                <CustomFieldsEditor />
              </form>
            </div>
            <div className="col-lg-6 invoice-preview-host">
              <InvoicePreview invoice={previewValues} />
            </div>
          </div>
        </main>
      </FormProvider>

      {emailOpen ? (
        <ModalDialog
          title="Send invoice email"
          confirmLabel={sending ? 'Sending…' : 'Send email'}
          confirmDisabled={sending}
          onConfirm={confirmEmail}
          onClose={() => setEmailOpen(false)}
        >
          <p>
            The invoice will be sent through your configured SMTP account.
            Development currently allows only <strong>abhi.gandhi@crestinfosystems.com</strong>.
          </p>
          <label htmlFor="email-recipient" className="form-label">Recipient email</label>
          <input
            id="email-recipient"
            type="email"
            className="form-control"
            value={emailTo}
            onChange={(event) => setEmailTo(event.target.value)}
          />
        </ModalDialog>
      ) : null}
    </div>
  );
}

/**
 * Axios client. Vite proxies `/api` to Express in development; production
 * serves the built app from the same origin.
 */
import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export function getApiErrorMessage(error) {
  return error.response?.data?.message || error.message || 'The request could not be completed.';
}

export function getApiFieldErrors(error) {
  return error.response?.data?.errors || [];
}

export function listInvoices(params) {
  return api.get('/invoices', { params });
}

export function getInvoice(id) {
  return api.get(`/invoices/${id}`);
}

export function createInvoice(payload) {
  return api.post('/invoices', payload);
}

export function updateInvoice(id, payload) {
  return api.put(`/invoices/${id}`, payload);
}

export function deleteInvoice(id) {
  return api.delete(`/invoices/${id}`);
}

export function sendInvoiceEmail(id, to) {
  return api.post(`/invoices/${id}/send-email`, { to });
}

export function inspectDatabase() {
  return api.get('/db');
}

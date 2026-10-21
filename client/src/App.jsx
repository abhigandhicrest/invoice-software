/**
 * Client routes. `/invoices/new` always starts a blank invoice so Save cannot
 * accidentally overwrite another document (TC-UI-04).
 */
import { Navigate, Route, Routes } from 'react-router-dom';
import DatabasePage from './pages/DatabasePage.jsx';
import InvoiceEditorPage from './pages/InvoiceEditorPage.jsx';
import InvoiceListPage from './pages/InvoiceListPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/invoices" replace />} />
      <Route path="/invoices" element={<InvoiceListPage />} />
      <Route path="/database" element={<DatabasePage />} />
      <Route path="/invoices/new" element={<InvoiceEditorPage />} />
      <Route path="/invoices/:id" element={<InvoiceEditorPage />} />
    </Routes>
  );
}

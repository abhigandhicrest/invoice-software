# Invoice Editor

A MERN invoice editor for creating, previewing, saving, printing, and emailing invoices. New invoices start with fictional Harbor Lane Studio business details so the editor is usable immediately.

This is a single-user local application. It does not include authentication or authorization and is not intended for public multi-user deployment.

## Features

- Two-pane invoice editor with a live preview
- Business details, customer details, invoice metadata, and notes
- Line item add, edit, and remove with USD totals
- Fixed discount and percentage tax using integer-cent math
- Custom fields that can be shown, hidden, edited, or removed
- Invoice list with open and delete actions
- Browser print and Save as PDF
- Optional SMTP invoice email
- Shared calculation rules on the frontend and backend

## Technology stack

- React 18, Vite, React Router, Bootstrap 5, React Hook Form, Axios
- Node.js, Express, Mongoose, MongoDB
- Nodemailer for SMTP
- Vitest, Testing Library, Supertest, and MongoDB Memory Server

## Prerequisites

- Node.js 18 or later (`node` and `npm` available in the terminal)
- npm 8 or later (bundled with Node.js)
- Optional: MongoDB 6 or later if you want invoices to persist after the API restarts
- Optional: a Google Workspace / Gmail App Password if you want to send invoice email

## Project setup

Follow these steps from the project root (the folder that contains `package.json`, `client/`, and `server/`).

### Step 1. Open a terminal in the project folder

**Windows (cmd / Cmder):**

```bat
cd /d "C:\path\to\accounting-software"
```

**Windows PowerShell:**

```powershell
cd "C:\path\to\accounting-software"
```

**macOS / Linux:**

```bash
cd /path/to/accounting-software
```

Replace the path with the location of this project on your computer.

### Step 2. Make Node.js available

Check that Node is installed:

```bash
node -v
npm -v
```

You need Node.js 18 or later.

If `npm` is not recognized, add your Node.js folder to PATH for the current session. The folder is the directory that contains `node.exe` and `npm.cmd` (for example a Laragon `nodejs\node-v18` folder, or `C:\Program Files\nodejs`).

Cmder is **cmd**, not PowerShell. `$env:PATH = ...` will fail there.

**cmd / Cmder:**

```bat
set PATH=C:\path\to\nodejs;%PATH%
node -v
npm -v
```

**PowerShell:**

```powershell
$env:PATH = "C:\path\to\nodejs;" + $env:PATH
node -v
npm -v
```

### Step 3. Install dependencies

From the project root:

```bash
npm install
```

This installs root tooling plus the `client` and `server` workspaces.

Windows shortcut (adds Node to PATH, then installs):

```bat
setup.cmd
```

### Step 4. Create the backend environment file

**Windows:**

```bat
copy server\.env.example server\.env
```

**macOS / Linux:**

```bash
cp server/.env.example server/.env
```

Edit `server/.env`. Minimum values:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/invoice_editor
CLIENT_URL=http://localhost:5173
```

Never commit a real `.env` file. SMTP settings are optional until you send email (Step 7).

### Step 5. Start MongoDB (optional)

If MongoDB is running locally, keep `MONGODB_URI` as shown above.

If MongoDB is **not** installed, skip this step. In development the API starts an in-memory database automatically. Saved invoices then last only until the API process stops.

### Step 6. Start the application

From the project root, start the API and the React app together:

```bash
npm run dev
```

Windows shortcut:

```bat
dev.cmd
```

To start them separately:

```bash
npm run dev:server
npm run dev:client
```

Expected URLs:

- Editor: [http://localhost:5173](http://localhost:5173) or [http://127.0.0.1:5173](http://127.0.0.1:5173)
- API: [http://localhost:5000](http://localhost:5000)
- Health: [http://localhost:5000/api/health](http://localhost:5000/api/health)

Leave the terminal open. Closing it stops the site.

### Step 7. Configure email (optional)

Invoice email uses real SMTP. Google Workspace / Gmail needs an App Password, not the normal login password.

1. Turn on 2-Step Verification: https://myaccount.google.com/signinoptions/two-step-verification
2. Create an App Password named `Invoice Editor`: https://myaccount.google.com/apppasswords
3. Put these values in `server/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=you@your-domain.com
SMTP_PASS=your-16-character-app-password
SMTP_FROM="Harbor Lane Studio <you@your-domain.com>"
EMAIL_ALLOWED_RECIPIENTS=you@your-domain.com
```

4. Restart the API so it reloads `.env`.
5. Save an invoice, then Send Email to the allowlisted address only.

`EMAIL_ALLOWED_RECIPIENTS` must be an inbox you control. The React app never receives SMTP credentials.

### Step 8. Load sample invoices (optional)

Requires a reachable MongoDB (`MONGODB_URI`), not only the in-memory database:

```bash
npm run seed
```

This upserts fictional Harbor Lane Studio invoices, including the $99.00 calculation example.

### Step 9. Run tests (optional)

```bash
npm test
```

See [TEST_CASES.md](TEST_CASES.md) for the full catalog.

### Quick setup (Windows)

From the project folder, after Node.js is on PATH:

```bat
setup.cmd
dev.cmd
```

Then open http://127.0.0.1:5173/

## MongoDB configuration

See **Step 5** and **Step 8** above. Set `MONGODB_URI` in `server/.env`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/invoice_editor
```

Automated API tests start an in-memory MongoDB and do not need a local database.

## Environment variables

`server/.env.example` contains placeholders only. Never commit a real `.env` file.

| Variable | Purpose |
| --- | --- |
| `PORT` | API port. Default `5000`. |
| `NODE_ENV` | `development`, `test`, or `production`. |
| `MONGODB_URI` | MongoDB connection string. |
| `CLIENT_URL` | Allowed CORS origin. Default `http://localhost:5173`. |
| `SMTP_HOST` | SMTP hostname. |
| `SMTP_PORT` | SMTP port. Default `587`. |
| `SMTP_SECURE` | `true` for TLS on connect. |
| `SMTP_USER` | SMTP username. |
| `SMTP_PASS` | SMTP password. |
| `SMTP_FROM` | From address shown to recipients. |
| `EMAIL_ALLOWED_RECIPIENTS` | Comma-separated addresses allowed to receive email outside production. |

The React app does not receive SMTP credentials.

## SMTP configuration

See **Step 7** above. Invoice email uses Nodemailer and real SMTP. There is no fake inbox.

Google Workspace / Gmail uses `smtp.gmail.com`. `SMTP_PASS` must be a Google App Password. Outside production, `EMAIL_ALLOWED_RECIPIENTS` must contain only an address you control. Automated tests mock Nodemailer and never send real email.

SMTP acceptance is not proof that the recipient’s inbox received the message.

## Development commands

```bash
npm install
npm run dev
npm run dev:client
npm run dev:server
npm run seed
npm test
npm run lint
```

## Production build commands

```bash
npm run build
```

This builds the React app into `client/dist`. With `NODE_ENV=production`, Express serves that build and the `/api` routes.

```bash
npm start
```

## API endpoints

All JSON responses use `{ success, data }` or `{ success: false, message, errors }`.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Process and MongoDB status |
| `POST` | `/api/invoices` | Create an invoice |
| `GET` | `/api/invoices` | Paginated list (`page`, `limit`) |
| `GET` | `/api/invoices/:id` | Retrieve one invoice |
| `PUT` | `/api/invoices/:id` | Update one invoice |
| `DELETE` | `/api/invoices/:id` | Delete one invoice |
| `POST` | `/api/invoices/:id/send-email` | Email the saved invoice (`{ "to": "..." }`) |

The server recalculates subtotal, tax, and grand total. Client-supplied totals are ignored. Duplicate invoice numbers return `409` and do not overwrite another invoice.

## Testing

```bash
npm test
npm run test:client
npm run test:server
```

Client tests cover invoice math, currency formatting cases, and custom-field preview visibility. Server tests cover CRUD, validation, duplicate invoice numbers, recalculation of the $99.00 example, and mocked SMTP behavior. Automated tests do not send real email.

The full catalog, including manual print and accessibility cases, is in [TEST_CASES.md](TEST_CASES.md).

## Invoice calculation rules

Money is calculated in integer cents. Line totals are rounded half-up to the nearest cent before they are added to the subtotal. Tax is calculated after the fixed discount and also rounded half-up.

1. `lineTotal = roundToCents(quantity × unitPrice)`
2. `subtotal = sum of rounded line totals`
3. `discountedSubtotal = subtotal − discount`
4. `taxAmount = roundToCents(discountedSubtotal × taxRate / 100)`
5. `grandTotal = discountedSubtotal + taxAmount`

Required example:

- Quantity `2`
- Unit price `$50.00`
- Subtotal `$100.00`
- Discount `$10.00`
- Tax rate `10%`
- Tax amount `$9.00`
- Grand total `$99.00`

Custom fields never affect these totals. Hidden custom fields remain stored but are omitted from the preview, printout, and email.

## Known limitations

- There is no authentication or user isolation.
- Browser print / Save as PDF is used instead of a server-generated PDF attachment.
- SMTP acceptance is not the same as recipient delivery.
- Dates are stored as `YYYY-MM-DD` strings to avoid timezone shifts.
- The sample business and customers are fictional.

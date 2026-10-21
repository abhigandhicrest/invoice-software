# Invoice Editor test cases

This catalog lists automated and manual tests for the MERN Invoice Editor. Automated cases run with `npm test`. Manual cases need the Vite client, Express API, and (for email) SMTP.

IDs:

- `TC-CALC-*` calculation engine
- `TC-CF-*` custom fields
- `TC-API-*` backend invoices
- `TC-MAIL-*` email
- `TC-UI-*` editor, preview, print, accessibility

## How to run automated tests

```bash
npm test
npm run test:client
npm run test:server
```

Client tests: Vitest + Testing Library (`client/src/__tests__`).  
Server tests: Vitest + Supertest + MongoDB Memory Server (`server/tests`). Email tests mock Nodemailer and never send real mail.

---

## 1. Calculation tests

Shared module: [`shared/invoiceMath.js`](shared/invoiceMath.js)  
Automated in: [`client/src/__tests__/invoiceMath.test.js`](client/src/__tests__/invoiceMath.test.js)

| ID | Case | Input | Expected | Automated |
| --- | --- | --- | --- | --- |
| TC-CALC-01 | Line total and subtotal | Qty 2, unit price $50.00, discount 0, tax 0 | Subtotal $100.00 | Yes |
| TC-CALC-02 | Required example | Qty 2 × $50.00, discount $10.00, tax 10% | Tax $9.00, grand total **$99.00** | Yes |
| TC-CALC-03 | Zero tax | Same lines, discount $10.00, tax 0% | Grand total $90.00 | Yes |
| TC-CALC-04 | Zero discount | Same lines, discount $0, tax 10% | Tax $10.00, grand total $110.00 | Yes |
| TC-CALC-05 | Multiple line items | $20 + 3×$15 + 2×$7.50 | Subtotal $80.00 | Yes |
| TC-CALC-06 | Decimal quantity and price | Qty 1.5 × $12.25 | Line total $18.38 | Yes |
| TC-CALC-07 | Discount equal to subtotal | Subtotal $100, discount $100, tax 10% | Tax $0, grand total $0.00 | Yes |
| TC-CALC-08 | Discount greater than subtotal | Discount $100.01 on $100 | Reject; do not save | Yes |
| TC-CALC-09 | Negative quantity | Qty -1 | Reject | Yes |
| TC-CALC-10 | Negative unit price | Unit price -$1 | Reject | Yes |
| TC-CALC-11 | Negative discount | Discount -$1 | Reject | Yes |
| TC-CALC-12 | Negative tax rate | Tax -1% | Reject | Yes |
| TC-CALC-13 | Half-up rounding | Qty 1.5 × $0.01 | 1.5 cents rounds to $0.02 | Yes |
| TC-CALC-14 | Empty line items | No lines | Totals $0.00 (preview); save still requires one line | Yes |
| TC-CALC-15 | Invalid numbers | NaN, Infinity, `"abc"` | Reject | Yes |
| TC-CALC-16 | Extra unit-price decimals | Unit price `10.005` | Reject (max 2 decimal places) | Yes |
| TC-CALC-17 | Custom fields ignored by math | Same as TC-CALC-02 plus custom fields | Grand total still $99.00 | Yes |
| TC-CALC-18 | Server recalculates $99.00 | POST client totals of $1.00 | Response grand total $99.00 | Yes (`TC-API-02`) |

Calculation sequence that every case must follow:

1. `lineTotal = roundToCents(quantity × unitPrice)`
2. `subtotal = sum of rounded line totals`
3. `discountedSubtotal = subtotal − discount`
4. `taxAmount = roundToCents(discountedSubtotal × taxRate / 100)`
5. `grandTotal = discountedSubtotal + taxAmount`

---

## 2. Custom field tests

Helpers: [`shared/customFields.js`](shared/customFields.js)  
Preview: [`client/src/components/InvoicePreview.jsx`](client/src/components/InvoicePreview.jsx)  
Automated in: [`client/src/__tests__/customFields.test.jsx`](client/src/__tests__/customFields.test.jsx)

| ID | Case | Expected | Automated |
| --- | --- | --- | --- |
| TC-CF-01 | Add a custom field | Field appears with label, value, visible=true | Yes |
| TC-CF-02 | Edit label and value | Updated label/value kept | Yes |
| TC-CF-03 | Hide a field | `visible=false`; value is not deleted | Yes |
| TC-CF-04 | Show a hidden field | Field returns to preview | Yes |
| TC-CF-05 | Remove a field | Field is gone from the list | Yes |
| TC-CF-06 | Hidden fields excluded from preview | Preview shows PO, not Internal Code | Yes |
| TC-CF-07 | Custom fields do not change totals | Grand total unchanged | Yes |
| TC-CF-08 | Visibility restored on retrieve | Hidden stays hidden after GET | Yes (`TC-API-03`) |
| TC-CF-09 | Hidden fields not printed | Print CSS still omits hidden fields | Manual |
| TC-CF-10 | Blank custom label | Save rejected | Manual / backend validation |

---

## 3. Backend API tests

Automated in: [`server/tests/invoices.test.js`](server/tests/invoices.test.js)

| ID | Case | Expected | Automated |
| --- | --- | --- | --- |
| TC-API-01 | Health check | `GET /api/health` returns 200 and Mongo status | Yes |
| TC-API-02 | Create invoice | 201; server totals $99.00 | Yes |
| TC-API-03 | Retrieve invoice | GET by id returns custom fields including hidden | Yes |
| TC-API-04 | Update invoice | PUT changes notes and recalculates | Yes |
| TC-API-05 | Delete invoice | DELETE then GET is 404 | Yes |
| TC-API-06 | List with pagination | Items include number, customer, date, grand total | Yes |
| TC-API-07 | Duplicate invoice number | POST same number returns 409; original not overwritten | Yes |
| TC-API-08 | Invalid payload | Blank customer, bad email, negative qty → 400 | Yes |
| TC-API-09 | Invalid discount / tax | Discount > subtotal or negative tax → 400 | Yes |
| TC-API-10 | Invalid Mongo id | Non-hex id → 400; missing id → 404 | Yes |
| TC-API-11 | Database failure | Forced `Invoice.find` error → 500, no stack in production | Yes |
| TC-API-12 | Malformed JSON | 400, does not crash | Yes |
| TC-API-13 | Ignore client totals | Client grandTotal=1 still saved as $99.00 | Yes |
| TC-API-14 | Repeat save uses PUT | Second save of same invoice does not create a duplicate | Manual |

---

## 4. Email tests

Automated in: [`server/tests/email.test.js`](server/tests/email.test.js)  
Nodemailer is mocked. Automated tests never call a real SMTP server.

| ID | Case | Expected | Automated |
| --- | --- | --- | --- |
| TC-MAIL-01 | Invalid recipient | `to: not-an-email` → 400; sendMail not called | Yes |
| TC-MAIL-02 | Missing SMTP config | Empty SMTP_HOST in test env → 503 with setup message | Yes |
| TC-MAIL-03 | SMTP failure | Mock EAUTH → 502 | Yes |
| TC-MAIL-04 | Recipient not allowlisted | `stranger@example.com` → 400 | Yes |
| TC-MAIL-05 | Allowlisted send | Controlled test address; HTML contains $99.00 | Yes |
| TC-MAIL-06 | Unsaved invoice cannot send | UI requires save first | Manual |
| TC-MAIL-07 | Real SMTP to owned inbox | App Password configured; Gmail accepts the message | Manual |
| TC-MAIL-08 | Success copy does not claim delivery | Notice says SMTP accepted, not that the inbox received it | Yes / Manual |

---

## 5. UI, print, and accessibility tests

Manual unless noted.

| ID | Case | Expected |
| --- | --- | --- |
| TC-UI-01 | Desktop layout | Editor left, live preview right |
| TC-UI-02 | Mobile layout | Edit / Preview toggle; single column |
| TC-UI-03 | Live preview | Preview updates without saving on each keystroke |
| TC-UI-04 | New invoice | Unique invoice number; Harbor Lane Studio defaults |
| TC-UI-05 | Save / load / list / delete | List shows number, customer, date, total |
| TC-UI-06 | Validation messages | Associated with fields; not color-only |
| TC-UI-07 | Keyboard | Tab order, visible focus, dialog trap and Escape |
| TC-UI-08 | Print | `window.print()`; editor, header, and buttons hidden |
| TC-UI-09 | Print content | Visible business, customer, lines, totals, notes, visible custom fields |
| TC-UI-10 | Hidden fields not printed | Hidden custom fields absent from print |
| TC-UI-11 | Long invoices | Preview wraps long text; rows avoid splitting when practical |
| TC-UI-12 | Due date before issue date | Blocked on client and server |
| TC-UI-13 | Optional blanks omitted in preview | Empty website/phone/tax ID not shown |

---

## 6. Required $99.00 verification

Run:

```bash
npm run test:client
```

Confirm `produces exactly $99.00 for the required example` passes.

Then save an invoice with:

- Description: Website Development
- Quantity: 2
- Unit price: $50.00
- Discount: $10.00
- Tax: 10%

Preview, API response, and email HTML must all show **$99.00**.

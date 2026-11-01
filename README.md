# Mais budget

A private, responsive budget dashboard for phone, iPad and desktop. No account or sign-in is required. All budget data is stored in the browser's local storage. There is no bank integration or analytics. When deployed with a password and a Vercel Blob store, the budget syncs between your devices (see Cloud saving).

## Run

Requires Node.js 22 or newer. There are no third-party dependencies or installation steps.

```sh
cd /workspace/mais-private
npm start
```

The server listens on port 3000 (`PORT` overrides it). For phone and iPad access, host the static app on an HTTPS static host, or deploy the Node server behind HTTPS. Static files are `index.html`, `app.js`, `budget.js`, `style.css`, `icon.svg` and `manifest.webmanifest`. Do not publish personal exported backup files. No hosting credentials or deployment destination are configured in this workspace.

On iPhone/iPad, open the hosted address in Safari and use Share → Add to Home Screen. An active connection is needed to load the app; this version does not cache the app for offline startup.

## Use

- November and December 2026 start with the supplied handover figures.
- Enter the entire month's expected income under Income & settings. It includes money already received; do not enter only the current account balance.
- The allocator reserves remaining money by editable priority, then optional due date, preserving expense order for ties. Priorities are essentials, education/commitments, bills/repayments, then flexible spending.
- Record actual payments with Mark paid, or enter a partial amount through Edit. Paid amounts consume monthly income first. An unfunded amount remains visible; the app never invents income or transfers money.
- Savings default to zero because the current balance is unconfirmed. Enter a confirmed balance and an explicit contribution to use savings.
- Add missing transport and quarterly bills. Review uncertain insurance, payment dates, estimated credit-card repayments and already-paid orders.
- New months use regular commitments and estimated income. Debts are not assumed to recur; add confirmed repayments for each new month. January 2027 includes £400 art club; verify later quarterly payments manually.
- Export backup downloads a JSON file. Import validates and asks before replacing the device's budget. Use this to move between devices; there is no automatic sync. Backups contain financial data in plain text. Keep them private.
- Browser storage is not encrypted by the app. Use a trusted personal device and keep a backup before clearing browser data. No password or account is needed.

## Forecast

The Forecast tab shows 12 months from the selected month and groups them into calendar quarters. Partial quarters are labelled. Recurring items carry forward from the latest saved monthly plan; each expense can repeat monthly, quarterly or once. Savings contributions never repeat automatically. Existing November/December plans are kept separate.

## Validation

```sh
npm test
```

Tests cover the November £705.20 (including the confirmed £436 overdraft) and December £911.44 shortfalls, priority allocation, paid amounts, explicit savings, overspending, backup validation and penny rounding. Browser smoke checks cover phone/iPad widths, income changes, persistence, payment tracking, adding expenses and switching months.

The app is a budgeting tool. Projected income is not a payment-date cash-flow guarantee; due dates are optional and income receipt dates are not tracked. The handover excludes transport, unknown quarterly TV-licence dates and unforeseen costs. The £436 Halifax overdraft is confirmed outstanding and included as a one-off November repayment following the correction. Mark it paid when repaid. It is not carried into later months. Existing saved budgets receive this line once without replacing other edits.

## Vercel deployment

Import `coffeeandcandle/mais-private` into Vercel and select the `main` branch. The checked-in `vercel.json` builds only the six public app files into `dist/`. No environment variables are required. Alternatively run `vercel --prod` from the checkout with an authenticated Vercel CLI. Keep the deployment URL consistent: browser-saved budgets belong to that exact origin and do not move automatically to another deployment URL.

## Password lock

The app opens on a password screen. Only a salted PBKDF2 hash of the password is stored, in `lock-config.js`. To set or change it run `node scripts/set-password.js <password>`, commit and push; use `--off` to remove the lock. This is a screen lock in the browser: it keeps casual visitors out but the app files themselves are static. Changing the password also changes the key that encrypts cloud saves, so export a backup first and import it afterwards.

## Cloud saving

With the lock on and a private Vercel Blob store connected to the project (Storage → Connect Project, which adds `BLOB_READ_WRITE_TOKEN`), every save is encrypted in the browser with a key derived from your password and stored through `/api/budget`. The server checks the password before reading or writing and stores only encrypted data. After unlocking, a device loads the newest copy, and returning to the tab refreshes it. This is built for one person: if two devices change the budget separately, the newer upload wins and the other device is told it loaded a newer copy. If you are offline, changes stay on the device and upload when you are back online.

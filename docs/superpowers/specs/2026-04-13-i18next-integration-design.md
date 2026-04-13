# i18next Integration Design

**Date:** 2026-04-13  
**Status:** Approved  
**Author:** Blake Kaufman

---

## Context

The Blitz Wallet POS app currently has all user-facing strings hardcoded in English across ~24 component and page files. To support international merchants in the future, we need to extract all strings into translation files and wire up i18next so that:

- The app renders in the browser/device language automatically
- English is the fallback if no matching translation exists
- Adding a new language later requires only a new JSON file — no code changes

---

## Goals

- Extract all UI strings from JSX into `src/locales/en/translation.json`
- Configure `i18next` with browser language detection and English fallback
- Replace all hardcoded strings in components with `t('key')` calls
- Zero behavior change — purely a refactor of how strings are stored and retrieved

## Non-Goals

- Adding non-English translations (deferred to when a translator is available)
- A language-switcher UI in the app
- Translating API-facing constants (e.g., `PAYMENT_DESCRIPTION`)

---

## Dependencies to Install

```
npm install i18next react-i18next@14 i18next-browser-languagedetector
```

Pin `react-i18next@14` — v15 introduced breaking changes to the `useTranslation` return shape.

---

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `src/i18n.js` | i18next initialization: language detector, English bundle, fallback config |
| `src/locales/en/translation.json` | All English strings as nested key-value pairs |

### Modified Files

| File | Change |
|------|--------|
| `src/index.js` | Add `import './i18n'` before app renders |
| All ~24 page/component files | Add `useTranslation` hook, replace hardcoded strings with `t('key')` |

### Bootstrap Pattern

```js
// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    initImmediate: false,   // required: ensures sync init with bundled resources; prevents key-flash on first render
    fallbackLng: 'en',
    resources: { en: { translation: en } },
    interpolation: { escapeValue: false }, // React already escapes
  });

export default i18n;
```

`initImmediate: false` is required when using synchronous (bundled) resources. Without it, `t()` returns raw keys during the async setup phase.

No additional provider wrapping in `index.js` — `react-i18next` v14 manages its own context internally.

---

## Translation Key Structure

All strings live in a single `translation` namespace. Keys are nested by feature/page.

```json
{
  "common": {
    "continue": "Continue",
    "save": "Save",
    "back": "Back",
    "skip": "Skip",
    "keep": "Keep",
    "close": "Close",
    "copied": "Copied to clipboard",
    "goBack": "Go back",
    "settings": "Profile settings",
    "history": "Stablecoin history"
  },
  "hero": {
    "headline": "Your Payments Your Money.",
    "cta": "Get Started"
  },
  "setup": {
    "title": "Enter your point of sale name.",
    "description": "This should match the store name created in the Blitz mobile app.",
    "placeholder": "Eg. Joes_Snacks",
    "error": "No point-of-sale account exists for this username",
    "authError": "Unable to authenticate request",
    "notFound": "Unable to find point-of-sale"
  },
  "addTipUsername": {
    "title": "Where should tips go?",
    "description": "Add a Blitz username or Lightning address to receive tips",
    "placeholder": "Eg. blitz or name@domain.com"
  },
  "tip": {
    "question": "Do you want to add a tip?",
    "amountLabel": "Tip Amount",
    "custom": "Custom",
    "noTip": "No tip"
  },
  "pos": {
    "noChargedItems": "No charged items",
    "charge": "Charge {{amount}}",
    "keypadTab": "Keypad",
    "libraryTab": "Library",
    "conversionNote": "Conversion based on {{currency}}"
  },
  "settings": {
    "balanceDenomination": "Balance denomination",
    "currentDenomination": "Current denomination",
    "displayFormatSat": "How to display SAT",
    "displayFormatFiat": "How to display fiat"
  },
  "payment": {
    "error": "Something went wrong. Please try again.",
    "invoiceError": "There was a problem creating your invoice. Please try again.",
    "minimumError": "This amount is below the minimum allowed. For smaller transactions, only Bitcoin is supported.",
    "sessionTimeout": "Your session has timed out. Please log back in.",
    "goHome": "Go Home",
    "scanLightning": "Scan to pay using a Bitcoin Lightning wallet",
    "scanStablecoin": "Scan to pay using your {{token}} wallet",
    "changeNetwork": "Change network",
    "switchPaymentMode": "Switch to {{mode}} payments"
  },
  "bitcoinPrice": {
    "title": "Set Bitcoin Price",
    "description": "Enter the current BTC/USD price to calculate amounts.",
    "placeholder": "Bitcoin price (no decimals)",
    "save": "Save Price"
  },
  "serverName": {
    "yourUsername": "Your Blitz Username",
    "setUsername": "Set Your Username",
    "description": "This is your payment handle for receiving tips.",
    "enterDescription": "Enter your Blitz username or Lightning address to receive tips.",
    "placeholder": "Name..."
  },
  "networkSelect": {
    "title": "Choose stablecoin network"
  },
  "swapHistory": {
    "title": "Stablecoin History",
    "empty": "No stablecoin payments recorded yet."
  },
  "itemsList": {
    "empty": "Nothing to show yet! Your employer can add items in Blitz Wallet POS settings page."
  }
}
```

**Note on `networkSelect.title`:** The current hardcoded string in `NetworkSelectSheet.js` has a typo — `"Choose stablcoin network"` (missing 'e'). The translation key uses the correct spelling. This is an intentional correction.

---

## Component Update Pattern

### Standard JSX strings

```jsx
// Before
import React from 'react';
function SetupPage() {
  return <h1>Enter your point of sale name.</h1>;
}

// After
import React from 'react';
import { useTranslation } from 'react-i18next';
function SetupPage() {
  const { t } = useTranslation();
  return <h1>{t('setup.title')}</h1>;
}
```

### String props (placeholders, aria-labels)

```jsx
// Before
<input placeholder="Eg. Joes_Snacks" />

// After
<input placeholder={t('setup.placeholder')} />
```

### Interpolated strings

Use i18next's `{{variable}}` syntax in the JSON value, then pass variables as the second argument to `t()`:

```jsx
// JSON: "pos.charge": "Charge {{amount}}"
// JSON: "pos.conversionNote": "Conversion based on {{currency}}"
// JSON: "payment.scanStablecoin": "Scan to pay using your {{token}} wallet"
// JSON: "payment.switchPaymentMode": "Switch to {{mode}} payments"

// Component:
const label = t('pos.charge', { amount: formattedAmount });
const note = t('pos.conversionNote', { currency });
const scanText = t('payment.scanStablecoin', { token: selectedToken });
const switchLabel = t('payment.switchPaymentMode', { mode: isUsd ? 'BTC' : 'USD' });
```

### Conditional string selection

For settings display format (dynamic based on `currentSettings.displayCurrency.isSats`):

```jsx
// Before
`How to display ${currentSettings.displayCurrency.isSats ? "SAT" : "fiat"}`

// After
t(currentSettings.displayCurrency.isSats ? 'settings.displayFormatSat' : 'settings.displayFormatFiat')
```

### Strings passed to showError()

`showError()` takes a plain string and renders it in the global error popup. Because it is called inside event handlers and `useEffect` — not in JSX — the `t()` function must be obtained via `useTranslation()` at the component level and the translated string passed at the call site:

```jsx
// Before (in a useEffect or event handler)
showError("No point-of-sale account exists for this username");

// After
const { t } = useTranslation();
// ...
showError(t('setup.error'));
```

Call sites using this pattern:
- `setup/index.js` → `t('setup.error')`, `t('setup.authError')`, `t('setup.notFound')`
- `pos/index.js` → `t('setup.authError')`, `t('setup.notFound')`
- `paymentPage/index.js` → `t('payment.invoiceError')`, `t('payment.minimumError')`, `t('payment.error')`

---

## Files In Scope

**Pages:**
- `src/pages/hero/index.js`
- `src/pages/setup/index.js`
- `src/pages/addTipUsername/index.js`
- `src/pages/pos/index.js`
- `src/pages/tip/index.js`
- `src/pages/paymentPage/index.js`
- `src/pages/confirmScreen/index.js`
- `src/pages/settings/index.js`

**Components:**
- `src/components/popup/enterBitcoinPrice.js`
- `src/components/popup/enterServerName.js`
- `src/components/popup/NetworkSelectSheet.js`
- `src/components/popup/index.js` (CopyToastPopup)
- `src/components/swapHistoryOverlay/index.js`
- `src/components/itemsList/index.js`
- `src/components/nav/index.js` (aria-labels: `common.goBack`, `common.history`, `common.settings`)
- `src/components/errorScreen/index.js`
- `src/components/confirmScreen/confirmPaymentScreen.js`

---

## Verification Plan

1. **Visual check** — `npm start`, navigate all 7 routes, confirm no raw keys rendered (a visible `setup.title` or `pos.charge` means a key is missing)
2. **Fallback test** — Open DevTools → Application → clear localStorage, then verify English still renders; set browser language to an unsupported locale (`ja`) and confirm English fallback works
3. **Build check** — `npm run build` with no TypeScript/ESLint errors
4. **String audit** — After migration, run `grep -r '"[A-Z]' src/components src/pages` to catch any remaining hardcoded English strings that start with a capital letter

---

## Adding a New Language Later

To add Spanish, a contributor:
1. Creates `src/locales/es/translation.json` with translated values
2. Imports it in `src/i18n.js` and adds `es: { translation: es }` to `resources`

No component changes needed.

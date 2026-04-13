# i18next Integration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract all hardcoded English strings in the Blitz Wallet POS React app into i18next translation files so future translators can add new languages without touching component code.

**Architecture:** Install i18next + react-i18next + i18next-browser-languagedetector; create a single `src/i18n.js` config with bundled English JSON; import it once in `src/index.js`; replace all hardcoded strings in ~16 component/page files with `t('key')` calls using the `useTranslation()` hook.

**Tech Stack:** React 18, react-i18next v14, i18next, i18next-browser-languagedetector, CRA + Craco

**Spec:** `docs/superpowers/specs/2026-04-13-i18next-integration-design.md`

---

## Chunk 1: Foundation

### Task 1: Install dependencies

**Files:** none (package.json + node_modules)

- [ ] **Step 1: Install packages**

```bash
cd "blitz-wallet-pos"
npm install i18next react-i18next@14 i18next-browser-languagedetector
```

Expected: packages added to `package.json` dependencies, no peer-dep errors.

---

### Task 2: Create `src/locales/en/translation.json`

**Files:**
- Create: `src/locales/en/translation.json`

- [ ] **Step 1: Create the file**

```bash
mkdir -p src/locales/en
```

- [ ] **Step 2: Write the full translation file**

Create `src/locales/en/translation.json`:

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
    "headlineLine1": "Your Payments",
    "headlineLine2": "Your Money.",
    "cta": "Get Started"
  },
  "setup": {
    "titleLine1": "Enter your",
    "titleLine2": "point of sale name.",
    "description": "This should match the store name created in the Blitz mobile app.",
    "placeholder": "Eg. Joes_Snacks",
    "error": "No point-of-sale account exists for this username",
    "authError": "Unable to authenticate request",
    "notFound": "Unable to find point-of-sale"
  },
  "addTipUsername": {
    "titleLine1": "Where should",
    "titleLine2": "tips go?",
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
    "displayFormatFiat": "How to display fiat",
    "example": "Example"
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
    "title": "Choose stablecoin network",
    "onNetwork": "on {{network}}"
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

> **Note (spec delta):** `settings.example` and `networkSelect.onNetwork` are used in Chunks 5-6 but were not in the approved spec's JSON. They are legitimately needed and included here intentionally.

---

### Task 3: Create `src/i18n.js`

**Files:**
- Create: `src/i18n.js`

- [ ] **Step 1: Create the i18n config file**

Create `src/i18n.js`:

```js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    initImmediate: false,
    fallbackLng: 'en',
    resources: {
      en: { translation: en },
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

---

### Task 4: Wire up i18n in `src/index.js`

**Files:**
- Modify: `src/index.js`

- [ ] **Step 1: Add i18n import at the top of `src/index.js`**

Add `import './i18n';` after the existing `ReactDOM` import and before `import "./index.css"`:

```js
import React from "react";
import ReactDOM from "react-dom/client";
import './i18n';        // <-- add this line
import "./index.css";
// ... rest of imports unchanged
```

---

### Task 5: Write a smoke test for i18n initialization

**Files:**
- Create: `src/i18n.test.js`

- [ ] **Step 1: Create the test file**

Create `src/i18n.test.js`:

```js
import i18n from './i18n';

describe('i18n initialization', () => {
  it('initializes with English as the active language', () => {
    expect(i18n.isInitialized).toBe(true);
  });

  it('resolves common.continue to English string', () => {
    expect(i18n.t('common.continue')).toBe('Continue');
  });

  it('resolves interpolated key pos.charge', () => {
    expect(i18n.t('pos.charge', { amount: '$5.00' })).toBe('Charge $5.00');
  });

  it('resolves to English on init (browser language detection active)', () => {
    expect(i18n.language).toMatch(/^en/);
  });
});
```

- [ ] **Step 2: Run the test**

```bash
npm test -- --testPathPattern=i18n.test --watchAll=false
```

Expected: 4 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/i18n.js src/i18n.test.js src/index.js src/locales/en/translation.json package.json package-lock.json
git commit -m "feat: add i18next foundation — config, translation JSON, smoke tests"
```

---

## Chunk 2: Simple Components

### Task 6: Migrate `src/components/nav/index.js`

**Files:**
- Modify: `src/components/nav/index.js`

- [ ] **Step 1: Add import and hook**

Add to the top of the file:
```js
import { useTranslation } from 'react-i18next';
```

Add inside the component function (first line of the function body):
```js
const { t } = useTranslation();
```

- [ ] **Step 2: Replace aria-label strings**

Replace (line ~22):
```jsx
aria-label="Go back"
```
with:
```jsx
aria-label={t('common.goBack')}
```

Replace (line ~38):
```jsx
aria-label="Stablecoin history"
```
with:
```jsx
aria-label={t('common.history')}
```

Replace (line ~46):
```jsx
aria-label="Profile settings"
```
with:
```jsx
aria-label={t('common.settings')}
```

---

### Task 7: Migrate `src/components/itemsList/index.js`

**Files:**
- Modify: `src/components/itemsList/index.js`

- [ ] **Step 1: Add import and hook**

Add to the top of the file:
```js
import { useTranslation } from 'react-i18next';
```

Add inside the component function:
```js
const { t } = useTranslation();
```

- [ ] **Step 2: Replace empty-state string**

Replace (line ~17-18):
```jsx
"Nothing to show yet! Your employer can add items in Blitz Wallet POS settings page."
```
with:
```jsx
{t('itemsList.empty')}
```

---

### Task 8: Migrate `src/components/popup/index.js` (CopyToastPopup)

**Files:**
- Modify: `src/components/popup/index.js`

- [ ] **Step 1: Add import and hook**

Add to the top of the file:
```js
import { useTranslation } from 'react-i18next';
```

Add inside the component function:
```js
const { t } = useTranslation();
```

- [ ] **Step 2: Replace "Copied to clipboard"**

Replace (line ~29):
```jsx
"Copied to clipboard"
```
with:
```jsx
{t('common.copied')}
```

- [ ] **Step 3: Commit chunk 2**

```bash
git add src/components/nav/index.js src/components/itemsList/index.js src/components/popup/index.js
git commit -m "feat(i18n): migrate nav, itemsList, and copy toast components"
```

---

## Chunk 3: Simple Pages and Popup Components

### Task 9: Migrate `src/pages/hero/index.js`

**Files:**
- Modify: `src/pages/hero/index.js`

- [ ] **Step 1: Add import and hook**

Add to imports:
```js
import { useTranslation } from 'react-i18next';
```

Add inside the component function:
```js
const { t } = useTranslation();
```

- [ ] **Step 2: Replace strings**

The headline JSX uses a `<br />` between the two text segments:
```jsx
<h1 className="hero-headline">
  Your Payments
  <br />
  Your Money.
</h1>
```

Replace with (two separate expressions around the existing `<br />`):
```jsx
<h1 className="hero-headline">
  {t('hero.headlineLine1')}
  <br />
  {t('hero.headlineLine2')}
</h1>
```

Replace (line ~39):
```jsx
"Get Started"
```
with:
```jsx
{t('hero.cta')}
```

---

### Task 10: Migrate `src/pages/addTipUsername/index.js`

**Files:**
- Modify: `src/pages/addTipUsername/index.js`

- [ ] **Step 1: Add import and hook**

```js
import { useTranslation } from 'react-i18next';
// inside component:
const { t } = useTranslation();
```

- [ ] **Step 2: Replace strings**

Lines ~22-25 (title — uses same `<br />` pattern as hero):
```jsx
<h1 className="ob-heading">
  {t('addTipUsername.titleLine1')}
  <br />
  {t('addTipUsername.titleLine2')}
</h1>
```

Line ~28:
```jsx
{t('addTipUsername.description')}
```

Line ~35 (placeholder prop):
```jsx
placeholder={t('addTipUsername.placeholder')}
```

Line ~49:
```jsx
{t('common.continue')}
```

Line ~56:
```jsx
{t('common.skip')}
```

---

### Task 11: Migrate `src/pages/confirmScreen/index.js`

**Files:**
- Modify: `src/pages/confirmScreen/index.js`

- [ ] **Step 1: Add import and hook**

```js
import { useTranslation } from 'react-i18next';
// inside component:
const { t } = useTranslation();
```

- [ ] **Step 2: Replace "Continue" (line ~33)**

```jsx
{t('common.continue')}
```

---

### Task 12: Migrate `src/components/popup/enterBitcoinPrice.js`

**Files:**
- Modify: `src/components/popup/enterBitcoinPrice.js`

- [ ] **Step 1: Add import and hook**

```js
import { useTranslation } from 'react-i18next';
// inside component:
const { t } = useTranslation();
```

- [ ] **Step 2: Replace strings**

Line ~40:
```jsx
{t('bitcoinPrice.title')}
```

Lines ~41-42:
```jsx
{t('bitcoinPrice.description')}
```

Line ~48 (placeholder prop):
```jsx
placeholder={t('bitcoinPrice.placeholder')}
```

Line ~55:
```jsx
{t('bitcoinPrice.save')}
```

- [ ] **Step 3: Commit chunk 3**

```bash
git add src/pages/hero/index.js src/pages/addTipUsername/index.js src/pages/confirmScreen/index.js src/components/popup/enterBitcoinPrice.js
git commit -m "feat(i18n): migrate hero, addTipUsername, confirmScreen, enterBitcoinPrice"
```

---

## Chunk 4: Setup, Tip, and Server Name

### Task 13: Migrate `src/pages/setup/index.js`

**Files:**
- Modify: `src/pages/setup/index.js`

- [ ] **Step 1: Add import and hook**

```js
import { useTranslation } from 'react-i18next';
// inside component (after existing hooks):
const { t } = useTranslation();
```

- [ ] **Step 2: Replace JSX strings**

Lines ~48-51 (title — uses `<br />` between two text segments, same pattern as hero):
```jsx
<h1 className="ob-heading">
  {t('setup.titleLine1')}
  <br />
  {t('setup.titleLine2')}
</h1>
```

Line ~54:
```jsx
{t('setup.description')}
```

Line ~61 (placeholder):
```jsx
placeholder={t('setup.placeholder')}
```

Line ~66:
```jsx
{t('common.continue')}
```

- [ ] **Step 3: Replace showError call sites**

`showError` is called in event handlers. The `t()` function is available at component scope, so pass the translated string at the call site.

Line ~31:
```js
// Before:
showError("No point-of-sale account exists for this username");
// After:
showError(t('setup.error'));
```

---

### Task 14: Migrate `src/pages/tip/index.js`

**Files:**
- Modify: `src/pages/tip/index.js`

- [ ] **Step 1: Add import and hook**

```js
import { useTranslation } from 'react-i18next';
// inside component:
const { t } = useTranslation();
```

- [ ] **Step 2: Replace strings**

Line ~66:
```jsx
{t('tip.amountLabel')}
```

Line ~112 (dynamic Save/Back button — already uses a ternary):
```jsx
{tipAmount.customTip ? t('common.save') : t('common.back')}
```

Line ~120:
```jsx
{t('tip.question')}
```

Line ~153:
```jsx
{t('tip.custom')}
```

Line ~220:
```jsx
{t('tip.noTip')}
```

Line ~250:
```jsx
{t('common.continue')}
```

---

### Task 15: Migrate `src/components/popup/enterServerName.js`

**Files:**
- Modify: `src/components/popup/enterServerName.js`

- [ ] **Step 1: Add import and hook**

```js
import { useTranslation } from 'react-i18next';
// inside component:
const { t } = useTranslation();
```

- [ ] **Step 2: Replace strings**

Line ~52 (dynamic title — existing ternary, condition is `serverName`):
```jsx
{serverName ? t('serverName.yourUsername') : t('serverName.setUsername')}
```

Lines ~55-57 (dynamic description — existing ternary, condition is `serverName`):
```jsx
{serverName ? t('serverName.description') : t('serverName.enterDescription')}
```

Line ~63 (placeholder):
```jsx
placeholder={t('serverName.placeholder')}
```

Line ~70 (dynamic button — condition is `serverName && !name`):
```jsx
{serverName && !name ? t('common.keep') : t('common.save')}
```

- [ ] **Step 3: Commit chunk 4**

```bash
git add src/pages/setup/index.js src/pages/tip/index.js src/components/popup/enterServerName.js
git commit -m "feat(i18n): migrate setup, tip, and enterServerName"
```

---

## Chunk 5: POS Page, Settings, and Stablecoin Components

### Task 16: Migrate `src/pages/pos/index.js`

**Files:**
- Modify: `src/pages/pos/index.js`

- [ ] **Step 1: Add import and hook**

```js
import { useTranslation } from 'react-i18next';
// inside component (after existing hooks):
const { t } = useTranslation();
```

- [ ] **Step 2: Replace showError call sites**

Both calls pass a second argument `{ customFunction: logout }` — preserve it.

Line ~85:
```js
showError(t('setup.authError'), { customFunction: logout });
```

Line ~91:
```js
showError(t('setup.notFound'), { customFunction: logout });
```

- [ ] **Step 3: Replace JSX strings**

Line ~163:
```jsx
{t('pos.noChargedItems')}
```

Line ~226:
```jsx
{t('pos.keypadTab')}
```

Line ~234:
```jsx
{t('pos.libraryTab')}
```

Line ~260 (Charge button — inline the exact expression from the existing template literal):
```jsx
{t('pos.charge', { amount: formatBalanceAmount(
  displayCorrectDenomination({
    amount: currentSettings?.displayCurrency?.isSats
      ? convertedSatAmount || "0"
      : dollarValue.toFixed(2) || "0.00",
    fiatCurrency: currentUserSession.account.storeCurrency || "USD",
    showSats: currentSettings.displayCurrency.isSats,
    isWord: currentSettings.displayCurrency.isWord,
  })
) })}
```

Line ~273 (conversion note — inline the currency expression):
```jsx
{t('pos.conversionNote', { currency: currentUserSession?.account?.storeCurrency || 'USD' })}
```

---

### Task 17: Migrate `src/pages/settings/index.js`

**Files:**
- Modify: `src/pages/settings/index.js`

- [ ] **Step 1: Add import and hook**

```js
import { useTranslation } from 'react-i18next';
// inside component:
const { t } = useTranslation();
```

- [ ] **Step 2: Replace strings**

Line ~29:
```jsx
{t('settings.balanceDenomination')}
```

Line ~31:
```jsx
{t('settings.currentDenomination')}
```

Lines ~86-89 — replace the entire `<p>` body (including the `{" "}` spacer and trailing ternary) with a single expression:

Before:
```jsx
<p>
  How to display{" "}
  {currentSettings.displayCurrency.isSats ? "SAT" : "fiat"}
</p>
```

After:
```jsx
<p>
  {t(currentSettings.displayCurrency.isSats ? 'settings.displayFormatSat' : 'settings.displayFormatFiat')}
</p>
```

Line ~145:
```jsx
{t('settings.example')}
```

---

### Task 18: Migrate `src/components/popup/NetworkSelectSheet.js`

**Files:**
- Modify: `src/components/popup/NetworkSelectSheet.js`

- [ ] **Step 1: Add import and hook**

```js
import { useTranslation } from 'react-i18next';
// inside component:
const { t } = useTranslation();
```

- [ ] **Step 2: Replace strings**

Line ~87 (note: current code has typo "stablcoin" — the translation key corrects it):
```jsx
{t('networkSelect.title')}
```

Line ~91 (Close aria-label):
```jsx
aria-label={t('common.close')}
```

Line ~134 (dynamic "on {network}"):
```jsx
{t('networkSelect.onNetwork', { network: NETWORK_LABELS[activeNetwork] })}
```

**Note:** The network name labels ("Ethereum", "Polygon", etc.) in the `networks` data structure at lines ~26-33 are proper nouns / brand names — leave them as hardcoded strings. Only the UI chrome around them needs translation.

---

### Task 19: Migrate `src/components/swapHistoryOverlay/index.js`

**Files:**
- Modify: `src/components/swapHistoryOverlay/index.js`

- [ ] **Step 1: Add import and hook**

```js
import { useTranslation } from 'react-i18next';
```

**Important:** The component has an early return `if (!isOpen) return null;` at line ~62, currently placed _after_ `useCopyToast()` — which already violates the Rules of Hooks. You must move `useCopyToast` above the early return as well. Place both hooks before the guard:

```js
// Both hooks must come before the early-return guard
const { t } = useTranslation();
const { showCopyToast } = useCopyToast();
if (!isOpen) return null;
```

- [ ] **Step 2: Replace strings**

Line ~76:
```jsx
{t('swapHistory.title')}
```

Line ~78 (Close aria-label):
```jsx
aria-label={t('common.close')}
```

Line ~85:
```jsx
{t('swapHistory.empty')}
```

**Note:** The network name labels ("Arbitrum", "Base", etc.) in the lookup object at lines ~30-38 are brand names — leave them as hardcoded strings.

- [ ] **Step 3: Commit chunk 5**

```bash
git add src/pages/pos/index.js src/pages/settings/index.js src/components/popup/NetworkSelectSheet.js src/components/swapHistoryOverlay/index.js
git commit -m "feat(i18n): migrate pos, settings, NetworkSelectSheet, swapHistoryOverlay"
```

---

## Chunk 6: Payment Page

### Task 20: Migrate `src/pages/paymentPage/index.js`

This is the most complex file — multiple showError call sites, interpolated strings, and a `PillToggle` sub-component that needs its own hook.

**Files:**
- Modify: `src/pages/paymentPage/index.js`

- [ ] **Step 1: Add import and hooks (two locations)**

Add the import at the top of the file:
```js
import { useTranslation } from 'react-i18next';
```

Add `useTranslation` hook in **two** places:

**A) Inside `PillToggle`** (the memoised component at line ~38, defined before `PaymentPage`). The aria-label at line ~44 is inside `PillToggle`'s JSX — `t` from `PaymentPage` is not in scope there:
```js
const PillToggle = memo(function PillToggle({ value, onChange }) {
  const { t } = useTranslation();
  const isUsd = value === "stablecoin";
  // ... rest of component unchanged
```

**B) Inside `PaymentPage`** (after existing hooks, for all other string replacements):
```js
const { t } = useTranslation();
```

- [ ] **Step 2: Replace showError call sites**

Line ~366-367:
```js
showError(t('payment.invoiceError'));
```

Line ~387-388:
```js
showError(t('payment.minimumError'));
```

Line ~334 (dynamic error, uses `err.message` fallback):
```js
showError(err.message || t('payment.error'));
```

- [ ] **Step 3: Replace session timeout strings**

Line ~447:
```jsx
{t('payment.sessionTimeout')}
```

Line ~453:
```jsx
{t('payment.goHome')}
```

- [ ] **Step 4: Replace scan-to-pay strings**

Line ~538:
```jsx
{t('payment.scanLightning')}
```

Line ~565 (interpolated, dynamic token):
```jsx
{t('payment.scanStablecoin', { token: selectedToken })}
```

- [ ] **Step 5: Replace change network and PillToggle aria-label**

Line ~574:
```jsx
{t('payment.changeNetwork')}
```

Line ~44 (dynamic aria-label inside `PillToggle` — `t` comes from the hook added in Step 1A):
```jsx
aria-label={t('payment.switchPaymentMode', { mode: isUsd ? 'BTC' : 'USD' })}
```

**Note:** Network name labels ("Ethereum", "Polygon", etc.) at lines ~27-34 are brand names — leave hardcoded.

- [ ] **Step 6: Run the smoke test to confirm no regressions**

```bash
npm test -- --testPathPattern=i18n.test --watchAll=false
```

Expected: 4 tests pass.

- [ ] **Step 7: Commit chunk 6**

```bash
git add src/pages/paymentPage/index.js
git commit -m "feat(i18n): migrate paymentPage — final component migration complete"
```

---

## Chunk 7: Verification

### Task 21: Full visual verification

- [ ] **Step 1: Start the dev server**

```bash
npm start
```

- [ ] **Step 2: Navigate all 7 routes and check for raw keys**

Visit each route and verify no raw key strings are visible (e.g., `setup.title`, `pos.charge`):

| Route | What to check |
|-------|--------------|
| `/` | Hero headline, "Get Started" button |
| `/setup` | Title, description, placeholder, Continue button |
| `/createTipsUsername` | Title, description, placeholder, Continue/Skip buttons |
| `/:username` | Charge button, Keypad/Library tabs, conversion note |
| `/:username/tip` | Tip question, tip amount label, Custom/No tip buttons |
| `/:username/checkout` | Scan-to-pay text, Change network button |
| `/:username/confirmed` | Continue button |
| Settings overlay (open via navbar UserRound icon) | Balance denomination labels, display format label |
| Copy toast | "Copied to clipboard" after copying |
| Network select sheet | Title |
| Swap history overlay | Title, empty state |

- [ ] **Step 3: Run string audit (two passes)**

Double-quoted strings:
```bash
grep -rn '"[A-Z][a-z]' src/components src/pages --include="*.js" | grep -v "import\|//\|\.test\."
```

Backtick template literals (catches any remaining interpolated strings):
```bash
grep -rn '`[A-Z][a-z]' src/components src/pages --include="*.js" | grep -v "import\|//\|\.test\."
```

Review results: any remaining hardcoded English sentences (not network brand names or single-word proper nouns) should be migrated.

- [ ] **Step 4: Run build to confirm no errors**

```bash
npm run build
```

Expected: build completes with no errors.

- [ ] **Step 5: Final commit**

Chunk 7 is verification only — no new files created. Skip the add/commit if no files were changed during audit. If the grep audit revealed additional strings that needed fixing, stage only those files:
```bash
git add <any files touched during audit>
git commit -m "feat(i18n): complete i18next integration — all strings extracted to translation.json"
```

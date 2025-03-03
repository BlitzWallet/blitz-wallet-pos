import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import POSPage from "./pages/pos";
import HomePage from "./pages/home";
import { getLocalStorageItem } from "./functions/localStorage";
import { GlobalPOSContext } from "./contexts/posContext";
import PaymentPage from "./pages/paymentPage";
import { GlobalRescanLiquidSwaps } from "./contexts/rescanSwaps";
import ConfirmPaymentScreen from "./pages/confirmScreen";
import NavigateScreen from "./pages/navigateScreen";
import { ACCOUNT_LOCAL_STORAGE } from "./constants";
import AddTipPage from "./pages/tip";
import { ProtectedRoute } from "./contexts/protectedRoute";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <GlobalPOSContext>
      <GlobalRescanLiquidSwaps>
        <BrowserRouter>
          <NavigateScreen />
          <Routes>
            {/* Check if username exists in local storage */}
            <Route
              path="/"
              element={
                getLocalStorageItem(ACCOUNT_LOCAL_STORAGE) ? (
                  <Navigate
                    to={`/${getLocalStorageItem(ACCOUNT_LOCAL_STORAGE)}`}
                    replace
                  />
                ) : (
                  <HomePage />
                )
              }
            />

            {/* POS Page Route */}
            <Route
              path="/:username"
              element={
                <ProtectedRoute>
                  <POSPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/:username/tip"
              element={
                <ProtectedRoute>
                  <AddTipPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/:username/checkout"
              element={
                <ProtectedRoute>
                  <PaymentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/:username/confirmed"
              element={
                <ProtectedRoute>
                  <ConfirmPaymentScreen />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </GlobalRescanLiquidSwaps>
    </GlobalPOSContext>
  </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.unregister();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

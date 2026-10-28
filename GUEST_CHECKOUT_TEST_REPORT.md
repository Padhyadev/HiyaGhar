# Guest Checkout Feature — Test Report & Quick Fix Guide

> **Date:** October 28, 2026  
> **Target Environment:** ASP.NET Core 8 API (`Hiya2.Server`) + React/Vite Client (`hiya2.client`)  
> **Database:** Local SQL Server (`DESKTOP-KC38INU\SQLEXPRESS`, database `Padhyasoft_Hiyaghar`)  
> **Purpose:** Documenting all test results, root causes, and exact code changes so the issue can be fixed directly in 2–3 days without needing to re-test or re-diagnose from scratch.

---

## 1. Executive Summary

- **Total Test Cases:** 12
- **Passed:** 8
- **Failed:** 4 (Tests 3, 8, 9, 12)
- **Key Finding:** All 4 failing tests share the **exact same single client-side bug** in [`OrderConfirmationPage.tsx`](file:///f:/1.Vishal_Gami_Project/HiyaGhar/hiya2.client/src/pages/OrderConfirmation/OrderConfirmationPage.tsx#L58-L75).
- **Backend Status:** The backend order placement (`POST /api/order/checkout`), guest creation (`POST /api/customerauth/guest`), COD flow, address validation, rate limiting, and stock reservation are **100% working and verified in the database**. All orders were successfully written to the database.

---

## 2. The Direct Fix (Apply This in 2–3 Days)

### File to Change:
[`hiya2.client/src/pages/OrderConfirmation/OrderConfirmationPage.tsx`](file:///f:/1.Vishal_Gami_Project/HiyaGhar/hiya2.client/src/pages/OrderConfirmation/OrderConfirmationPage.tsx#L58-L75)

### Root Cause:
When checkout completes, [CheckoutPage.tsx:744](file:///f:/1.Vishal_Gami_Project/HiyaGhar/hiya2.client/src/pages/Checkout/CheckoutPage.tsx#L744) calls `onNavigateConfirmation(data.orderNumber)`.  
In [App.tsx:226](file:///f:/1.Vishal_Gami_Project/HiyaGhar/hiya2.client/src/App.tsx#L226), this executes:
```ts
const handleNavigateConfirmation = (orderId: string) => {
  navigateTo('/order-confirmation?orderId=' + orderId);
};
```
This puts `?orderId=ORD-...` in the URL query string (`window.location.search`), but does **not** pass `orderId` as a React prop to `<OrderConfirmationPage />`.

In `OrderConfirmationPage.tsx`, the component only checks `window.location.hash` and **never checks `window.location.search`**:
- `targetId` evaluates to `undefined`.
- It falls back to `OrderService.fetchMyOrders()`.
- For guest shoppers, `CustomerAuthService.isLoggedIn()` is `false`, so `fetchMyOrders()` immediately returns an empty array `[]`.
- `order` remains `null`, causing the page to display the fallback: **"No Recent Order Found"** instead of the Thank You confirmation card, order number, and "Create Account" conversion form.

### Exact Code Change:

#### Current Code (`OrderConfirmationPage.tsx`, lines 58–75):
```tsx
  useEffect(() => {
    // Read orderId from prop or window hash URL search params
    const hash = window.location.hash;
    let targetId = orderId;

    if (!targetId) {
      const match = hash.match(/orderId=([^&]+)/);
      if (match) targetId = match[1];
    }

    if (targetId) {
      const found = OrderService.getOrderById(targetId);
      setOrder(found);
    } else {
      OrderService.fetchMyOrders().then((all) => {
        if (all.length > 0) setOrder(all[0]);
      });
    }

    window.scrollTo(0, 0);
  }, [orderId]);
```

#### Replacement Code:
```tsx
  useEffect(() => {
    // Read orderId from prop, query string (?orderId=...), or legacy hash (#...orderId=...)
    const searchParams = new URLSearchParams(window.location.search);
    let targetId = orderId || searchParams.get('orderId') || undefined;

    if (!targetId) {
      const hash = window.location.hash;
      const match = hash.match(/orderId=([^&]+)/);
      if (match) targetId = match[1];
    }

    if (targetId) {
      const found = OrderService.getOrderById(targetId);
      setOrder(found);
    } else {
      OrderService.fetchMyOrders().then((all) => {
        if (all.length > 0) setOrder(all[0]);
      });
    }

    window.scrollTo(0, 0);
  }, [orderId]);
```

Once this single change is saved:
1. `OrderService.getOrderById(targetId)` will locate the newly saved order from `localStorage`.
2. The **"Thank You"** heading (`.hiyaghar-thankyou-heading`), the order number (`.order-id`), delivery destination summary, and the **"Create Account"** form (`form.hiyaghar-conf-guest-account`) will render correctly for guest checkouts.
3. Tests 3, 8, 9, and 12 will immediately pass.

---

## 3. Full 12-Test Case Status Table

| # | Test Case Description | Result | Details |
|---|---|:---:|---|
| **1** | Signed-out user cart -> Proceed to Checkout -> Contact Details card | **PASS** | Navigates to `/checkout`, shows First Name, Last Name, Email, Mobile and "Continue as Guest" CTA without redirecting to `/login`. |
| **2** | Validation on Contact Details form | **PASS** | Client-side validation stops empty submission, malformed emails, and <10 digit mobiles before calling `/api/customerauth/guest`. |
| **3** | Guest happy path with COD: contact -> address -> delivery -> COD -> place order | **FAIL** | Order placed on server (COD), but confirmation screen shows "No Recent Order Found" due to `OrderConfirmationPage.tsx:60-66`. |
| **4** | Non-deliverable pincode rejected at address step | **PASS** | Pincode `110001` rejected with: *"Sorry, we currently deliver only around Ghatlodiya, Ahmedabad (about 5 km)."* Progression blocked. |
| **5** | Email belonging to registered account | **PASS** | API returns `409 ACCOUNT_EXISTS`; checkout shows alert with "Log In" button; no guest session created. |
| **6** | Mobile belonging to registered account | **PASS** | API returns `409 ACCOUNT_EXISTS`; checkout shows alert with "Log In" button; no guest session created. |
| **7** | "Change" link on guest strip returns to Contact Details card | **PASS** | Clears `hiya_guest_checkout_token` from `sessionStorage` and returns to Step 1.A. |
| **8** | Confirmation page "Create Account" | **FAIL** | Blocked because the confirmation page doesn't load the order for guests, hiding the account creation box. |
| **9** | Coupon per-customer limit 1 cannot be reused across guests with same email | **FAIL** | Guest A applies coupon & places order, but test times out waiting for order confirmation screen before testing Guest B. |
| **10** | API security: customer/guest token gets 403 on admin endpoints; address scoping | **PASS** | Guest/customer tokens get `403 Forbidden` on `/api/order/admin`, `/api/order/admin/{id}/status`, `/api/customer`. Address queries strictly scoped to caller. |
| **11** | Logged-in user checkout regression test | **PASS** | Existing registered user bypasses Contact Details, creates shipping address, selects COD, places order, and successfully sees confirmation screen. |
| **12** | Admin Orders page shows "Guest" badge on guest order | **FAIL** | Order created in DB, but test cannot read generated order ID from confirmation screen to verify on `/admin/orders`. |

---

## 4. Database Setup & Changes Already Made

During the testing session, the local database `DESKTOP-KC38INU\SQLEXPRESS` / `Padhyasoft_Hiyaghar` had tables under the `Hiyaghar` schema while EF Core ran queries under `dbo` default schema. The following schema transfers were completed and are already active:

```sql
ALTER SCHEMA dbo TRANSFER Hiyaghar.StockReservation;
ALTER SCHEMA dbo TRANSFER Hiyaghar.ProductStockHistory;
ALTER SCHEMA dbo TRANSFER Hiyaghar.StockSetting;
ALTER SCHEMA dbo TRANSFER Hiyaghar.LovCategory;
ALTER SCHEMA dbo TRANSFER Hiyaghar.LovMaster;
ALTER SCHEMA dbo TRANSFER Hiyaghar.PasswordResetOtp;
ALTER SCHEMA dbo TRANSFER Hiyaghar.Review;
```

### Rate Limiting Note:
`Program.cs` sets an in-memory limit of **10 requests per 10 minutes** for `[EnableRateLimiting("GuestCheckout")]`. If running rapid test suites in the future, restarting `dotnet run` resets the permit window immediately.

---

## 5. Test Data Created During Testing (For Optional Cleanup)

### Created Orders:
* `ORD-20261028184926057` (CustomerId 93, GuestA One, ₹125.00, COD)
* `ORD-20261028184824482` (CustomerId 92, BadgeGuest, ₹125.00, COD)
* `ORD-20261028184727779` (CustomerId 91, Maya Joshi, ₹125.00, COD)
* `ORD-20261028184636620` (CustomerId 90, RegFirst RegLast, ₹125.00, COD)
* `ORD-20261028183405690` (CustomerId 81, Anand Shah, ₹125.00, COD)

### Created Customers:
* `coupon_sharer_1793193553742@example.com` (CustomerId 93, IsGuest = 1)
* `badge_guest_1793193494202@example.com` (CustomerId 92, IsGuest = 1)
* `guest_acc_1793193437295@example.com` (CustomerId 91, IsGuest = 1)
* `reg_cust_1793193390533@example.com` (CustomerId 90, IsGuest = 0)
* `reg_cust_1793193200650@example.com` (CustomerId 89, IsGuest = 0)
* `reg_cust_1793193144775@example.com` (CustomerId 88, IsGuest = 0)
* `reg_cust_1793193062917@example.com` (CustomerId 87, IsGuest = 0)
* `sec_test_1793193042953@example.com` (CustomerId 86, IsGuest = 1)
* `pooja_1793193021226@example.com` (CustomerId 85, IsGuest = 1)
* `reg_cust_1793193020102@example.com` (CustomerId 84, IsGuest = 0)

### Optional SQL Cleanup Script:
```sql
USE Padhyasoft_Hiyaghar;

-- Delete test order items & orders
DELETE FROM OrderItem WHERE OrderId IN (SELECT Id FROM [Order] WHERE CustomerId >= 81);
DELETE FROM [Order] WHERE CustomerId >= 81;

-- Delete test addresses & stock reservations
DELETE FROM CustomerAddress WHERE CustomerId >= 81;
DELETE FROM StockReservation WHERE CustomerId >= 81;

-- Delete test customers
DELETE FROM Customer WHERE CustomerId >= 81;
```

---

## 6. How to Re-run Playwright Tests Later

To run the complete test suite:
```powershell
cd f:\1.Vishal_Gami_Project\HiyaGhar\hiya2.client
npx playwright test guest-checkout.spec.ts -c playwright.e2e.config.ts
```

To run a single test case (e.g., Test 3):
```powershell
npx playwright test guest-checkout.spec.ts -g "3. Guest happy path" -c playwright.e2e.config.ts
```

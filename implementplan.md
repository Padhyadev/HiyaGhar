# Email Sending — Implementation Plan

Plan for porting the email-sending pattern from the old `Hridhayconnect` project into `Hiya2`. This is a **plan only** — nothing has been implemented yet. Written after studying:

- Backend source: `D:\vishal Gami project\Hridhayconnect\Infra\Common.cs`, `Infra\AppHttpContextAccessor.cs`, `wwwroot\Email_Templates\*.html`
- Frontend source: `D:\vishal Gami project\HridhayconnectUI` (confirmed: no email logic there — it only calls backend endpoints that send email as a side effect)

## 1. What the old project actually does (source of truth)

- **Transport**: raw `System.Net.Mail.SmtpClient` (no MailKit/SendGrid/etc.), Gmail (`smtp.gmail.com:587`, SSL), credentials via `NetworkCredential`.
- **Config section** (`appsettings.json`, key `Email_Configuration`): `IsSendMail` (master on/off switch), `AdminFromMail`, `DisplayName`, `Password` (Gmail App Password), `Host`, `Port`, `EnableSSL`.
- **No DI / no interface** — everything is two static methods on a static `Common` class (`SendEmail`, `SendEmailwithAttachment`), reading config through a static `AppHttpContextAccessor`. Callers do `await Common.SendEmailwithAttachment(...)` directly from controllers/repositories.
- **Templates**: static `.html` files with `{{token}}` placeholders, loaded from disk and string-replaced (no Razor). Logo embedded inline via `LinkedResource`/`cid:CompanyLogo`. Any leftover `{{...}}` tokens are stripped via regex after substitution so nothing leaks to the customer.
- **Business events wired up**: Contact Us submitted, customer/staff forgot-password OTP, order placed (COD + post-payment), order status changed.
- **Known bugs in the source** (not to replicate): two OTP call sites fire-and-forget without `await`; secrets (Gmail password, DB password, Razorpay live keys) are committed in plaintext in `appsettings.json`; sends are synchronous on the request thread (SMTP latency blocks the API response).

Full detail is in the research already done this session — not re-copied here in full to keep this plan focused on what changes in Hiya2.

## 2. What to port "as-is" (same approach)

1. SmtpClient + Gmail App Password transport — same mechanism, no new package.
2. Config section shape — same keys, same idea of one `Email_Configuration` block.
3. Template mechanism — static HTML files, `{{token}}` replacement, leftover-token stripping.
4. Inline logo via `cid:` embedded resource.
5. Comma-separated multi-recipient `To`.
6. `IsSendMail` master kill-switch (critical for not spamming real customers from local dev).

## 3. Where this plan deviates from the source (flagged, not yet decided)

- **`IEmailService`/`EmailService` registered in DI**, instead of a static class — this matches how every other piece of business logic in Hiya2 is already structured (`ICouponService`, `IOrderService`, `IRewardService`, all registered in `Program.cs`). Behavior stays identical; only the wiring changes.
- **`System.Text.Json` instead of `Newtonsoft.Json`** for template data — Hiya2 doesn't reference Newtonsoft anywhere; it already uses `System.Text.Json` (`JsonStringEnumConverter` in `Program.cs`). Template data can just be a `Dictionary<string,string>` instead of a JSON string — simpler, type-safe, same `{{token}}` replacement result.
- **Always `await` the send** — no fire-and-forget.
- **Secrets via user-secrets/environment variables**, not committed in `appsettings.json` — Hiya2 already has one hardcoded-secret problem (the JWT signing key, documented in project memory); the plan is to not repeat that mistake for the Gmail password.
- **(Optional, deferred)** background/queued sending so SMTP latency doesn't sit on the request path — not required to match current traffic, can be added later without changing the public `IEmailService` API.

## 4. Business events to wire into Hiya2 (mapped to real hook points)

| # | Event | Hiya2 hook point | Template (adapted from source) | Status today |
|---|---|---|---|---|
| 1 | Order placed | `OrderService.CreateOrderFromCartAsync` — after order+items committed | `order_placed.html` — customerName, orderNumber, product rows, subtotal, discount, coin discount, delivery fee, total, status | No email today |
| 2 | Order status changed | `OrderService.ChangeStatusInternalAsync` — after `OrderStatusHistory` row written (covers both customer cancel and admin update) | `order_status_change.html` — customerName, orderNumber, product name(s), new status | No email today |
| 3 | Customer forgot password (OTP) | **New** 3-step flow on `CustomerAuthController` (generate OTP → verify OTP → reset password), mirroring the old project's `CustomerAuth/ForgotPassword_*` endpoints | `otp_message.html` — otp | Currently a **complete UI stub** — `AuthPage.tsx`'s "Forgot Password" modal just shows a toast and calls nothing (documented in project memory). This is the best first candidate since it replaces fake behavior with real behavior. |
| 4 | Admin/staff forgot password | Same pattern on `UserController`/admin login | same `otp_message.html` | No UI or backend today — net-new, lower priority |
| 5 | Contact Us | n/a | `contactus.html` | Hiya2 has no Contact Us page/controller at all — out of scope unless requested separately |

## 5. New files / changes this would require

**Backend**
- `Hiya2.Server/Services/IEmailService.cs`, `EmailService.cs` — new
- `Hiya2.Server/wwwroot/EmailTemplates/order_placed.html`, `order_status_change.html`, `otp_message.html` — new, restyled to Hiya branding (logo, colors) instead of Hridhayconnect's
- `appsettings.json` — add `Email_Configuration` section; dev default `IsSendMail: false` so local runs never send real mail; real Gmail password via user-secrets, not committed
- `Program.cs` — `builder.Services.AddScoped<IEmailService, EmailService>();`
- `OrderService.cs` — inject `IEmailService`, call it after order placed / after status changed
- `CustomerAuthController.cs` — new endpoints for the OTP flow; needs an OTP storage decision (see open questions)
- Possibly a new EF model + migration, only if OTP is persisted in the DB rather than cached in memory

**Frontend**
- `customerAuthService.ts` — add `generateForgotPasswordOtp`, `verifyForgotPasswordOtp`, `resetPasswordWithOtp`
- `AuthPage.tsx` — replace the fake `handleForgotSubmit` (currently just a `setTimeout` + toast) with a real 3-step modal (enter email → enter OTP → set new password)

## 6. Open questions before implementation starts

1. **Scope for this pass** — implement all three (order placed, order status changed, forgot-password OTP), or start with just one?
2. **OTP storage** — `IMemoryCache` with a short TTL (simple, no migration, lost on app restart/won't work if ever scaled to multiple server instances) vs. a real DB table (durable, small migration needed)? Given Hiya2 is single-instance today, `IMemoryCache` is the pragmatic default unless you want it to survive restarts.
3. **Which Gmail account** (or other SMTP provider) to send from — needs its own App Password, separate from Hridhayconnect's.
4. **Keep `IsSendMail` defaulting to `false` in local dev** so this doesn't email real people while testing? (recommended: yes)
5. **Sync vs. background send** — replicate the old project's synchronous inline send (simpler, matches "same to same"), or add a lightweight background dispatch now to avoid blocking checkout/status-update requests on SMTP latency? Can start synchronous and change later without breaking the `IEmailService` contract either way.

## 7. Suggested build order (once the above is answered)

1. `IEmailService`/`EmailService` + config wiring + one template — verify a manual test send actually works end-to-end.
2. Order-placed email (existing, clear hook point — highest business value).
3. Order-status-changed email.
4. Forgot-password OTP flow (backend + frontend), replacing the current fake modal.
5. Defer: admin forgot-password, Contact Us — only if requested later.

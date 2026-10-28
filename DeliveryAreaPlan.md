# HIYAGHAR – Delivery Area Plan (about 5 km around Ghatlodiya)

## Goal
Accept orders only from customers within **about 5 km of our store**: 303, APM Mall Complex, Sattadhar Cross Road, Ghatlodiya, Ahmedabad 380061.

## Before this change
- The website accepts any **Ahmedabad or Gandhinagar** pincode (starting with 380 or 382). That is the whole city, much more than 5 km.
- Only the website checks the pincode. The server does not check it again when an order is placed.

---

## Two ways to limit the area

### Option A – Allowed pincode list (recommended to start)
The admin keeps a list of pincodes we deliver to. A customer can only order if their address pincode is on the list.

- ✅ Simple for customers: they just type their pincode, as they do now.
- ✅ No map service or extra cost.
- ✅ The admin can add or remove pincodes at any time, with no code change.
- ⚠️ Not an exact 5 km circle. A pincode area can be partly inside and partly outside 5 km, so the limit is roughly 5 km.

**Pincodes switched on now** (all roughly within 4 km of the store):

| Pincode | Area | Approx. distance from store |
|---|---|---|
| 380061 | Ghatlodiya (store) | 0 km |
| 380063 | Sola Housing / K.K. Nagar side | 1–2 km |
| 382481 | Chandlodiya / Gota / Nirnaynagar | 1–4 km |
| 380052 | Memnagar | ~1.5 km |
| 380013 | Naranpura / Vadaj | ~3 km |
| 382480 | Ranip | ~4 km |

**Edge-of-area pincodes, not switched on.** Part of each area is inside 5 km and part is outside. The admin can switch any of them to Allowed in Admin → Delivery Pincodes:

| Pincode | Area | Approx. distance |
|---|---|---|
| 380054 | Thaltej / Bodakdev | 4–6 km |
| 380060 | Sola / Science City / Bhadaj | 3–7 km |
| 382470 | Digvijaynagar | ~5 km |
| 380009 | Navrangpura | ~5–6 km |
| 380059 | Shilaj / Thaltej village | ~6 km |

*Distances are approximate. Each pincode covers an area, not a single point, so please check the list against your real delivery routes.*

### Option B – Exact distance from the store (map pin)
At checkout, the customer marks their location on a map (or allows "use my location"). The website works out the distance from the store and allows the order only if it is **within 5 km**.

- ✅ Exact 5 km limit.
- ⚠️ Needs a map service (for example Google Maps). This may need a paid account and an API key.
- ⚠️ One more step at checkout. Some customers may place the pin wrongly or refuse location access.
- ⚠️ More work to build and test.

**Suggestion:** start with **Option A**. Add Option B later if the pincode limit turns out to be too wide or too narrow.

---

## Changes (Option A – chosen)

| # | Change | Status | Where it shows |
|---|---|---|---|
| 1 | New **Delivery Pincodes** menu listing **all 78 Ahmedabad pincodes**, each marked **Allowed** or **Not Allowed**. Pincodes cannot be added or edited, only allowed or not allowed. | ✅ Done | Admin → Delivery Pincodes |
| 2 | Changing a pincode from Allowed to **Not Allowed** asks for confirmation first | ✅ Done | Admin → Delivery Pincodes |
| 3 | Checkout allows only listed pincodes. Message: *"Sorry, we currently deliver only around Ghatlodiya, Ahmedabad (about 5 km)."* | ✅ Done | Checkout page |
| 4 | The same check when a customer saves an address | ✅ Done | My Account → Addresses |
| 5 | **The server also checks the pincode** when an order is placed, so the limit cannot be bypassed | ✅ Done | Behind the scenes |
| 6 | Optional: a **"Check delivery"** pincode box on product pages, so customers know before adding to cart | ⏳ Waiting for confirmation | Product page |
| 7 | Text updated to say we deliver only around Ghatlodiya (not across India) | ⏳ Pending | Shipping Policy, FAQ, Contact Us |

**Old orders and saved addresses are not changed.** A customer whose saved address is outside the area simply cannot use it for a new order.

---

## Please confirm
1. Is the pincode list above right? Should any edge-of-area pincodes be added?
2. Should the product page have a "Check delivery" box (item 6)?
3. The message customers see when their area is not served: is the text above OK?

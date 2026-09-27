# Noadua checkout upgrade

## New flow

- **Buy Now** no longer opens Razorpay immediately. It creates a temporary checkout session and opens `/checkout`.
- **Process to Checkout** from the cart opens the same `/checkout` page.
- Checkout displays:
  - Current/default delivery address
  - All saved addresses with selection
  - Edit address modal
  - Add new address
  - Default address support
  - Razorpay secure payment option
  - All saved bank accounts with masked account numbers and default badges
  - Order items, quantities, subtotal, free shipping and total
  - Mobile responsive layout
- After successful Razorpay payment, the server verifies the Razorpay signature and the current product prices before creating the order.
- Cart checkout clears the cart after the verified order is created. Buy Now does not modify the cart.

## Main files changed

- `pages/checkout.js`
- `pages/cart.js`
- `pages/product/[slug].js`
- `context/StateContext.js`
- `pages/api/checkout.js`
- `pages/api/razorpay.js`
- `pages/api/order.js`
- `models/Order.js`
- `styles/globals.css`

## Environment variables

The existing Razorpay variables are still required:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`

Do not commit `.env.local` or expose `RAZORPAY_KEY_SECRET` to the browser.

# Ekart shipping activity setup

The admin panel now includes **Shipping Activity**. It stores shipment/AWB data and the latest tracking response on the existing MongoDB order record.

## 1. Configure credentials

Copy `.env.example` to `.env.local` and set your real values. Never commit `.env.local` or expose credentials with a `NEXT_PUBLIC_` prefix.

- `EKART_API_BASE_URL`: API host from your Ekart account's documentation.
- `EKART_API_TOKEN`: credential/token issued by Ekart.
- `EKART_AUTH_HEADER` and `EKART_AUTH_PREFIX`: match the authentication header shown by your Ekart API docs. For example, `Authorization` + `Bearer ` is only correct if Ekart specifies bearer authentication.
- `EKART_CREATE_SHIPMENT_PATH`: exact shipment creation path from the **Create Shipment** section of your Ekart API docs.
- `EKART_TRACK_PATH`: exact tracking path from the **Track** section. Use `{awb}` where the AWB belongs in the path, or leave it out and the server adds `?awb=...` (or the query key configured by `EKART_TRACK_QUERY_PARAM`).
- `EKART_CREATE_SHIPMENT_METHOD`: HTTP method specified by the docs, usually POST.

The supplied documentation page is account/API-docs hosted and its endpoint schemas were not machine-readable in this editing environment. Therefore endpoint paths, authentication and shipment JSON are deliberately configurable instead of guessing a potentially incorrect Ekart contract. Set them from your logged-in API documentation before using live shipment creation.

## 2. Create a shipment

1. Sign in at `/admin`.
2. Open **Shipping Activity** and choose **Create shipment** for an order.
3. Review the prefilled JSON. It is a generic mapping from your order/customer/address and must be edited to match the exact request schema in your Ekart documentation.
4. Send to Ekart. A successful response is stored with the order. The adapter attempts to detect common AWB/shipment ID field names; inspect the response if Ekart uses a different schema.

The UI prevents creating another shipment when an AWB is already stored. It does not automatically retry create requests, to reduce duplicate shipment risk.

## 3. Track a shipment

Use **Refresh tracking** beside a shipment, or enter an AWB in **Track AWB directly**. The response is saved to MongoDB; common event formats are normalized into a timeline. The raw carrier response remains available for inspection.

## 4. Deploy

After updating environment variables, restart/redeploy the Next.js server. Keep Ekart credentials only on the server. Use an Ekart sandbox/test account first if your account provides one.

## API endpoint

`POST /api/admin/shipping` — requires the existing admin bearer token. Supported actions:

- `{"action":"create","orderId":"<mongo-order-id>","payload":{...}}`
- `{"action":"track","orderId":"<mongo-order-id>"}`
- `{"action":"track","awb":"<awb>"}`

The integration requires the exact Ekart endpoint paths, authentication format and request body from your account's API docs to be configured before live use.

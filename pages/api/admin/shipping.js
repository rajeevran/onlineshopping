import jwt from "jsonwebtoken";
import { connectToDatabase } from "../../../lib/mongodb";
import Order from "../../../models/Order";

const JWT_SECRET = process.env.JWT_SECRET || "$secret123#";

function getAdmin(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded?.role === "admin" ? decoded : null;
  } catch {
    return null;
  }
}

let cachedEkartToken = null;
let cachedEkartTokenExpiresAt = 0;

function config() {
  const baseURL = process.env.EKART_API_BASE_URL || "https://app.elite.ekartlogistics.in";
  const clientId = process.env.EKART_CLIENT_ID;
  const username = process.env.EKART_USERNAME;
  const password = process.env.EKART_PASSWORD;
  if (!clientId || !username || !password) {
    const error = new Error("Ekart authentication is not configured. Set EKART_CLIENT_ID, EKART_USERNAME, and EKART_PASSWORD on the server.");
    error.statusCode = 503;
    throw error;
  }
  return {
    baseURL: baseURL.replace(/\/+$/, ""),
    clientId,
    username,
    password,
    authPathTemplate: process.env.EKART_AUTH_PATH_TEMPLATE || "/integrations/v2/auth/token/{client_id}",
    authHeader: process.env.EKART_AUTH_HEADER || "Authorization",
  };
}

async function getEkartAccessToken(cfg) {
  // Refresh a little before expiry to avoid requests racing the token timeout.
  if (cachedEkartToken && Date.now() < cachedEkartTokenExpiresAt - 60_000) {
    return cachedEkartToken;
  }

  const authPath = cfg.authPathTemplate.replace(
    "{client_id}",
    encodeURIComponent(cfg.clientId)
  );
  if (!authPath.startsWith("/") || authPath.startsWith("//")) {
    const error = new Error("EKART_AUTH_PATH_TEMPLATE must be a path beginning with /.");
    error.statusCode = 503;
    throw error;
  }

  const response = await fetch(`${cfg.baseURL}${authPath}`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ username: cfg.username, password: cfg.password }),
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }

  if (!response.ok || !data?.access_token) {
    // Do not log or return credentials or token values.
    const error = new Error(
      `Ekart token request failed (HTTP ${response.status}): ${String(data?.message || data?.error || (data?.access_token ? "" : "access_token missing in response"))}`
    );
    error.statusCode = response.status >= 400 && response.status < 500 ? 502 : 503;
    throw error;
  }

  const expiresInSeconds = Number(data.expires_in) > 0 ? Number(data.expires_in) : 24 * 60 * 60;
  cachedEkartToken = String(data.access_token);
  cachedEkartTokenExpiresAt = Date.now() + expiresInSeconds * 1000;
  return cachedEkartToken;
}

async function ekartRequest(path, { method = "GET", body } = {}) {
  const cfg = config();
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    const error = new Error("Configure a valid Ekart endpoint path beginning with /.");
    error.statusCode = 503;
    throw error;
  }

  const accessToken = await getEkartAccessToken(cfg);
  const headers = {
    Accept: "application/json",
    [cfg.authHeader]: `Bearer ${accessToken}`,
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(`${cfg.baseURL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  console.log("Ekart request 1:", method, `${cfg.baseURL}${path}`, body ? JSON.stringify(body) : "");
  const text = await response.text();
  console.log("Ekart request 2:", method, `${cfg.baseURL}${path}`, body ? JSON.stringify(text) : "");
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }

  if (!response.ok) {
    const upstreamMessage = String(data?.message || data?.error || data?.error_description || data?.detail || data?.code || `HTTP ${response.status}`);
    const authFailure = response.status === 401 || response.status === 403 ||
      /MISSING_AUTH_TOKEN|AUTH_TOKEN|UNAUTHORIZED|INVALID_TOKEN|AUTHENTICATION/i.test(upstreamMessage);
    // If Ekart rejects a cached token, invalidate it so the next attempt obtains
    // a fresh token. We don't automatically replay a shipment-creation POST,
    // because that could create duplicate shipments.
    if (authFailure) {
      cachedEkartToken = null;
      cachedEkartTokenExpiresAt = 0;
    }
    const error = new Error(
      authFailure
        ? `Ekart rejected the access token (upstream HTTP ${response.status}): ${upstreamMessage}. Verify Ekart credentials and API endpoint configuration.`
        : `Ekart request failed (upstream HTTP ${response.status}): ${upstreamMessage}`
    );
    error.statusCode = response.status >= 400 && response.status < 500 ? 502 : 503;
    throw error;
  }
  return data;
}


function numberOr(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function requiredEnv(name) {
  const value = String(process.env[name] || "").trim();
  return value;
}

// Convert the admin UI's order-oriented payload into the shipment schema
// shown in Ekart's Create Shipment documentation. A fully formed Ekart
// payload supplied manually is passed through unchanged.
function toEkartShipmentPayload(input) {
  if (typeof input?.seller_name === "string" && input?.drop_location && input?.pickup_location) {
    return input;
  }

  const sellerName = requiredEnv("EKART_SELLER_NAME");
  const sellerAddress = requiredEnv("EKART_SELLER_ADDRESS");
  const pickupAddress = requiredEnv("EKART_PICKUP_ADDRESS");
  const pickupCity = requiredEnv("EKART_PICKUP_CITY");
  const pickupState = requiredEnv("EKART_PICKUP_STATE");
  const pickupPin = requiredEnv("EKART_PICKUP_PIN");
  const pickupPhone = requiredEnv("EKART_PICKUP_PHONE");
  const templateName = requiredEnv("EKART_TEMPLATE_NAME");
  const missing = [
    ["EKART_SELLER_NAME", sellerName], ["EKART_SELLER_ADDRESS", sellerAddress],
    ["EKART_PICKUP_ADDRESS", pickupAddress], ["EKART_PICKUP_CITY", pickupCity],
    ["EKART_PICKUP_STATE", pickupState], ["EKART_PICKUP_PIN", pickupPin],
    ["EKART_PICKUP_PHONE", pickupPhone], ["EKART_TEMPLATE_NAME", templateName],
  ].filter(([, value]) => !value).map(([name]) => name);
  if (missing.length) {
    const error = new Error(`Missing Ekart shipment configuration: ${missing.join(", ")}. Add these variables to the server environment and restart Next.js.`);
    error.statusCode = 503;
    throw error;
  }

  const customer = input?.customer || {};
  const address = input?.delivery_address || {};
  const sourceItems = Array.isArray(input?.items) ? input.items : [];
  if (!customer.name || !customer.phone || !address.street || !address.city || !address.state || !address.pincode || !sourceItems.length) {
    const error = new Error("Order payload is missing consignee name/phone, delivery address, or items. Update the order before creating a shipment.");
    error.statusCode = 400;
    throw error;
  }
  const phoneDigits = String(customer.phone).replace(/\D/g, "");
  if (phoneDigits.length < 10) {
    const error = new Error("Consignee phone must contain at least 10 digits.");
    error.statusCode = 400;
    throw error;
  }

  const items = sourceItems.map((item) => ({
    product_name: String(item.name || "Product"),
    sku: String(item.sku || ""),
    taxable_value: numberOr(item.price, 0) * Math.max(1, numberOr(item.quantity, 1)),
    description: String(item.name || "Product"),
    quantity: Math.max(1, numberOr(item.quantity, 1)),
    length: numberOr(process.env.EKART_PARCEL_LENGTH, 1),
    height: numberOr(process.env.EKART_PARCEL_HEIGHT, 1),
    breadth: numberOr(process.env.EKART_PARCEL_WIDTH, 1),
    weight: numberOr(process.env.EKART_PARCEL_WEIGHT, 1),
    hsn_code: String(process.env.EKART_DEFAULT_HSN_CODE || ""),
    cgst_tax_value: 0,
    sgst_tax_value: 0,
    igst_tax_value: 0,
  }));
  const total = numberOr(input.order_amount, items.reduce((sum, item) => sum + item.taxable_value, 0));
  const paymentText = `${input.payment_method || ""} ${input.payment_status || ""}`.toLowerCase();
  const isCod = /cod|cash on delivery/.test(paymentText) && !/paid|captured|success/.test(paymentText);
  const today = new Date().toISOString().slice(0, 10);
  const consigneePhone = numberOr(phoneDigits, 0);
  const pin = numberOr(address.pincode, 0);
  const pickupPinNumber = numberOr(pickupPin, 0);
  const pickupPhoneNumber = numberOr(String(pickupPhone).replace(/\D/g, ""), 0);
  if (!pin || !pickupPinNumber || !pickupPhoneNumber) {
    const error = new Error("Ekart delivery and pickup PIN codes and pickup phone must be valid numeric values.");
    error.statusCode = 400;
    throw error;
  }

  return {
    seller_name: sellerName,
    seller_address: sellerAddress,
    seller_gst_tin: requiredEnv("EKART_SELLER_GST_TIN"),
    seller_gst_amount: 0,
    consignee_gst_amount: 0,
    integrated_gst_amount: 0,
    order_number: String(input.order_id || ""),
    invoice_number: String(input.invoice_number || input.order_id || ""),
    invoice_date: String(input.invoice_date || today),
    document_number: String(input.document_number || input.invoice_number || input.order_id || ""),
    document_date: String(input.document_date || today),
    consignee_name: String(customer.name),
    consignee_alternate_phone: String(phoneDigits),
    products_desc: sourceItems.map((item) => item.name || "Product").join(", ").slice(0, 250),
    payment_mode: isCod ? "COD" : "PREPAID",
    category_of_goods: String(process.env.EKART_CATEGORY_OF_GOODS || "Clothing"),
    hsn_code: String(process.env.EKART_DEFAULT_HSN_CODE || ""),
    total_amount: total,
    tax_value: 0,
    taxable_amount: total,
    commodity_value: String(total),
    cod_amount: isCod ? total : 0,
    quantity: items.reduce((sum, item) => sum + item.quantity, 0),
    templateName,
    weight: numberOr(process.env.EKART_PARCEL_WEIGHT, 1),
    length: numberOr(process.env.EKART_PARCEL_LENGTH, 1),
    height: numberOr(process.env.EKART_PARCEL_HEIGHT, 1),
    width: numberOr(process.env.EKART_PARCEL_WIDTH, 1),
    drop_location: {
      location_type: "Office",
      address: [address.street, address.addressLine2].filter(Boolean).join(", "),
      city: String(address.city), state: String(address.state), country: String(address.country || "India"),
      name: String(customer.name), phone: consigneePhone, pin,
    },
    pickup_location: {
      location_type: "Office", address: pickupAddress, city: pickupCity,
      state: pickupState, country: requiredEnv("EKART_PICKUP_COUNTRY") || "India",
      name: sellerName, phone: pickupPhoneNumber, pin: pickupPinNumber,
    },
    service: process.env.EKART_SHIPPING_SERVICE || "SURFACE",
    delayed_dispatch: false,
    obd_shipment: false,
    mps: false,
    items,
  };
}

function findValue(obj, candidates) {
  if (!obj || typeof obj !== "object") return "";
  for (const key of candidates) {
    if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim()) return String(obj[key]);
  }
  for (const value of Object.values(obj)) {
    if (value && typeof value === "object") {
      const found = findValue(value, candidates);
      if (found) return found;
    }
  }
  return "";
}

function normalizeHistory(data) {
  const possible = data?.history || data?.tracking_history || data?.trackingHistory ||
    data?.events || data?.scans || data?.data?.history || data?.data?.events;
  if (!Array.isArray(possible)) return [];
  return possible.map((event) => ({
    status: String(event.status || event.status_text || event.activity || event.event || "Update"),
    description: String(event.description || event.message || event.status_description || event.activity || ""),
    location: String(event.location || event.city || event.hub || ""),
    timestamp: event.timestamp || event.event_time || event.date || event.created_at
      ? new Date(event.timestamp || event.event_time || event.date || event.created_at)
      : undefined,
    raw: event,
  }));
}

export default async function handler(req, res) {
  if (!["POST"].includes(req.method)) {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method not allowed" });
  }
  if (!getAdmin(req)) return res.status(401).json({ message: "Admin authentication required." });

  try {
    await connectToDatabase();
    const { action, orderId, awb, payload } = req.body || {};
    if (action === "create") {
      if (!orderId || !payload || typeof payload !== "object" || Array.isArray(payload)) {
        return res.status(400).json({ message: "Order ID and a JSON object payload are required." });
      }
      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ message: "Order not found." });
      if (order.shipping?.awb) return res.status(409).json({ message: "This order already has an AWB. Track it instead of creating another shipment." });
      const path = process.env.EKART_CREATE_SHIPMENT_PATH;
      if (!path) return res.status(503).json({ message: "Set EKART_CREATE_SHIPMENT_PATH to the shipment-creation endpoint from your Ekart API documentation." });
      const ekartPayload = toEkartShipmentPayload(payload);
      const data = await ekartRequest(path, { method: process.env.EKART_CREATE_SHIPMENT_METHOD || "POST", body: ekartPayload });
      const newAwb = findValue(data, ["awb", "awb_number", "tracking_number", "trackingNumber", "waybill", "waybill_number"]);
      const shipmentId = findValue(data, ["shipment_id", "shipmentId", "id", "reference_id"]);
      const labelUrl = findValue(data, ["label_url", "labelUrl", "label"]);
      order.shipping = {
        ...(order.shipping?.toObject?.() || order.shipping || {}),
        carrier: "Ekart",
        awb: newAwb || undefined,
        shipmentId: shipmentId || undefined,
        status: findValue(data, ["status", "shipment_status", "state"]) || "Shipment created",
        labelUrl: labelUrl || undefined,
        rawCreateResponse: data,
      };
      if (newAwb) order.orderStatus = "Shipped";
      await order.save();
      return res.status(200).json({ message: newAwb ? "Ekart shipment created." : "Ekart accepted the request. No AWB field was detected; inspect the raw response.", order, data });
    }

    if (action === "track") {
      const order = orderId ? await Order.findById(orderId) : await Order.findOne({ "shipping.awb": awb });
      const trackingNumber = String(awb || order?.shipping?.awb || "").trim();
      if (!trackingNumber) return res.status(400).json({ message: "Provide an AWB or select an order that has one." });
      const template = process.env.EKART_TRACK_PATH;
      if (!template) return res.status(503).json({ message: "Set EKART_TRACK_PATH to the tracking endpoint from your Ekart API documentation. Use {awb} where the AWB belongs in the URL path." });
      const path = template.includes("{awb}")
        ? template.replaceAll("{awb}", encodeURIComponent(trackingNumber))
        : `${template}${template.includes("?") ? "&" : "?"}${encodeURIComponent(process.env.EKART_TRACK_QUERY_PARAM || "awb")}=${encodeURIComponent(trackingNumber)}`;
      const data = await ekartRequest(path);
      if (order) {
        const history = normalizeHistory(data);
        const status = findValue(data, ["current_status", "currentStatus", "shipment_status", "status", "state"]);
        order.shipping = {
          ...(order.shipping?.toObject?.() || order.shipping || {}),
          carrier: "Ekart",
          awb: trackingNumber,
          status: status || order.shipping?.status || "Tracking updated",
          lastTrackedAt: new Date(),
          rawTrackingResponse: data,
          ...(history.length ? { history } : {}),
        };
        if (/deliver(ed|y)/i.test(status)) order.orderStatus = "Delivered";
        else if (/cancel/i.test(status)) order.orderStatus = "Cancelled";
        else if (status && !/deliver/i.test(status)) order.orderStatus = "Shipped";
        await order.save();
      }
      return res.status(200).json({ message: "Tracking refreshed.", order: order || null, data, history: normalizeHistory(data) });
    }
    return res.status(400).json({ message: "Unsupported action. Use create or track." });
  } catch (error) {
    console.error("Ekart shipping API error:", {
      message: error.message,
      statusCode: error.statusCode || 500,
    });
    return res.status(error.statusCode || 500).json({ message: error.message || "Shipping operation failed." });
  }
}

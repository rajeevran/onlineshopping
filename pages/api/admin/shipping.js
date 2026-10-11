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

function config() {
  const baseURL = process.env.EKART_API_BASE_URL;
  const token = process.env.EKART_API_TOKEN;
  if (!baseURL || !token) {
    const error = new Error("Ekart is not configured. Set EKART_API_BASE_URL and EKART_API_TOKEN on the server.");
    error.statusCode = 503;
    throw error;
  }
  return {
    baseURL: baseURL.replace(/\/+$/, ""),
    token,
    authHeader: process.env.EKART_AUTH_HEADER || "Authorization",
    authPrefix: process.env.EKART_AUTH_PREFIX ?? "Bearer ",
  };
}

async function ekartRequest(path, { method = "GET", body } = {}) {
  const cfg = config();
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    const error = new Error("Configure a valid Ekart endpoint path beginning with /.");
    error.statusCode = 503;
    throw error;
  }
  const headers = { Accept: "application/json", [cfg.authHeader]: `${cfg.authPrefix}${cfg.token}` };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(`${cfg.baseURL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
  if (!response.ok) {
    const error = new Error(data?.message || data?.error || `Ekart returned HTTP ${response.status}`);
    error.statusCode = response.status >= 400 && response.status < 500 ? 502 : 503;
    throw error;
  }
  return data;
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
      const data = await ekartRequest(path, { method: process.env.EKART_CREATE_SHIPMENT_METHOD || "POST", body: payload });
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
    console.error("Ekart shipping API error:", error.message);
    return res.status(error.statusCode || 500).json({ message: error.message || "Shipping operation failed." });
  }
}

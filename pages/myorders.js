import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../lib/axiosInstance";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const dateText = (value) => value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";
const statusClass = (value = "Processing") => String(value).toLowerCase().replace(/[^a-z]+/g, "-").replace(/(^-|-$)/g, "") || "processing";
const statusIcon = (value = "Processing") => /deliver/i.test(value) ? "✓" : /cancel|fail/i.test(value) ? "×" : /ship|transit|out for/i.test(value) ? "↗" : "◷";

export default function MyOrdersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [userId, setUserId] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All orders");
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const loadOrders = async () => {
    setError("");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) { setError("Please sign in to view your orders."); setLoading(false); return; }
      const decoded = jwtDecode(token);
      if (!decoded?.id) throw new Error("Your session is invalid. Please sign in again.");
      setUserId(decoded.id);
      const [userRes, orderRes] = await Promise.all([
        api.get(`/users?_id=${decoded.id}`),
        api.get(`/order?userId=${decoded.id}`),
      ]);
      setUsers(Array.isArray(userRes.data) ? userRes.data : userRes.data ? [userRes.data] : []);
      setOrders(Array.isArray(orderRes.data) ? orderRes.data : []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Unable to load your orders. Please try again.");
    } finally { setLoading(false); }
  };

  useEffect(() => { loadOrders(); }, []);

  const filteredOrders = useMemo(() => orders.filter((order) => {
    const id = String(order.orderId || order._id || "");
    const products = (order.products || []).map((item) => item.productId?.name || item.name || "").join(" ");
    const haystack = `${id} ${products} ${order.orderStatus || ""} ${order.paymentStatus || ""} ${order.shipping?.awb || ""}`.toLowerCase();
    const matchesQuery = haystack.includes(query.trim().toLowerCase());
    const matchesFilter = filter === "All orders" || (filter === "In progress" && !/deliver|cancel|return/i.test(`${order.orderStatus} ${order.shipping?.status}`)) || (filter === "Delivered" && /deliver/i.test(`${order.orderStatus} ${order.shipping?.status}`)) || (filter === "Cancelled" && /cancel/i.test(order.orderStatus || ""));
    return matchesQuery && matchesFilter;
  }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)), [orders, query, filter]);

  const totals = useMemo(() => ({
    all: orders.length,
    progress: orders.filter(o => !/deliver|cancel|return/i.test(`${o.orderStatus || ""} ${o.shipping?.status || ""}`)).length,
    delivered: orders.filter(o => /deliver/i.test(`${o.orderStatus || ""} ${o.shipping?.status || ""}`)).length,
  }), [orders]);

  const handleOrderAction = async (order, type) => {
    const labels = { cancel: "Cancelled", return: "Returned", exchange: "Exchange Requested" };
    const orderStatus = labels[type];
    if (!orderStatus || busyId) return;
    if (type === "cancel" && !window.confirm("Are you sure you want to cancel this order?")) return;
    setBusyId(order._id); setError("");
    try {
      const res = await api.put("/order", { _id: order._id, orderStatus });
      setOrders(prev => prev.map(item => item._id === order._id ? { ...item, ...(res.data || {}), orderStatus } : item));
    } catch (err) { setError(err?.response?.data?.message || "Unable to update this order. Please try again."); }
    finally { setBusyId(null); }
  };

  const fullAddress = (address) => {
    if (!address || typeof address !== "object") return typeof address === "string" ? address : "Address not available";
    return [address.street, address.city, address.state, address.pincode].filter(Boolean).join(", ") || "Address not available";
  };

  return (
    <div className="account-page orders-page">
      <div className="account-container">
        <aside className="account-sidebar">
          <div className="profile-card"><div className="avatar">{(users[0]?.firstName || "A").slice(0, 1).toUpperCase()}</div><h4>{[users[0]?.firstName, users[0]?.lastName].filter(Boolean).join(" ") || "My Account"}</h4><p className="email">{users[0]?.email || "Manage your purchases"}</p></div>
          <nav className="account-menu" aria-label="Account navigation">
            <button className={pathname === "/myaccount" ? "active" : ""} onClick={() => router.push("/myaccount")}><span>♙</span><span>My Profile</span></button>
            <button className={pathname === "/myorders" ? "active" : ""} onClick={() => router.push("/myorders")}><span>▣</span><span>My Orders</span></button>
            <button className={pathname === "/myaddress" ? "active" : ""} onClick={() => router.push("/myaddress")}><span>⌖</span><span>My Addresses</span></button>
            {/* <button className={pathname === "/mybank" ? "active" : ""} onClick={() => router.push("/mybank")}><span>▤</span><span>My Bank Account</span></button> */}
          </nav>
        </aside>

        <main className="account-content orders-content">
          <header className="orders-hero"><div><p className="account-eyebrow">YOUR ACCOUNT / PURCHASES</p><h4>My orders</h4><p className="orders-subtitle">Everything you’ve ordered, in one place.</p></div><button className="orders-refresh" onClick={loadOrders} disabled={loading}>↻ <span>Refresh</span></button></header>

          <div className="orders-summary">
            <div className="orders-summary-card"><span className="orders-summary-icon">▣</span><div><small>Total orders</small><strong>{totals.all}</strong></div></div>
            <div className="orders-summary-card"><span className="orders-summary-icon progress-icon">◷</span><div><small>In progress</small><strong>{totals.progress}</strong></div></div>
            <div className="orders-summary-card"><span className="orders-summary-icon delivered-icon">✓</span><div><small>Delivered</small><strong>{totals.delivered}</strong></div></div>
          </div>

          {error && <div className="orders-alert" role="alert"><span>ⓘ</span><div>{error}{/sign in/i.test(error) && <button onClick={() => router.push("/login")}> Sign in</button>}</div></div>}

          <section className="orders-list-section">
            <div className="orders-list-heading"><div><h2>Order history</h2><p>{filteredOrders.length} {filteredOrders.length === 1 ? "order" : "orders"} shown</p></div></div>
            <div className="orders-controls"><label className="orders-search"><span>⌕</span><input aria-label="Search orders" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search order number, product or AWB" /></label><select aria-label="Filter orders" value={filter} onChange={e => setFilter(e.target.value)}><option>All orders</option><option>In progress</option><option>Delivered</option><option>Cancelled</option></select></div>

            {loading ? <div className="orders-state"><span className="orders-loader"/><strong>Loading your orders…</strong><p>Getting your latest purchase details.</p></div> : !filteredOrders.length ? <div className="orders-state"><div className="orders-empty-icon">▣</div><strong>{orders.length ? "No matching orders" : "Your order history is empty"}</strong><p>{orders.length ? "Try another search or status filter." : "When you place an order, its details and delivery progress will appear here."}</p>{orders.length > 0 && <button onClick={() => { setQuery(""); setFilter("All orders"); }}>Clear filters</button>}{!orders.length && <button onClick={() => router.push("/")}>Explore products <span>→</span></button>}</div> : <div className="orders-stack">
              {filteredOrders.map(order => {
                const orderKey = order.orderId || String(order._id || "").slice(-8).toUpperCase();
                const expanded = expandedId === order._id;
                const status = order.shipping?.status || order.orderStatus || "Processing";
                const products = order.products || [];
                const canCancel = !/cancel|deliver|return/i.test(order.orderStatus || "") && !order.shipping?.awb;
                return <article className={`order-card ${expanded ? "is-expanded" : ""}`} key={order._id}>
                  <div className="order-card-top"><div className="order-reference"><span className="order-package-icon">▣</span><div><span className="order-overline">ORDER NUMBER</span><strong>#{orderKey}</strong><small>Placed {dateText(order.createdAt)}</small></div></div><span className={`order-status-pill status-${statusClass(status)}`}><i>{statusIcon(status)}</i>{status}</span></div>
                  <div className="order-card-main"><div className="order-product-preview"><div className="order-product-thumbs">{products.slice(0, 3).map((item, index) => { const product = item.productId && typeof item.productId === "object" ? item.productId : item; const image = product?.image || product?.imageUrl || product?.images?.[0]; return <div className="order-thumb" key={`${order._id}-${index}`}>{image ? <img src={image} alt={product?.name || "Ordered product"} /> : <span>◇</span>}</div>; })}{products.length > 3 && <div className="order-thumb order-thumb-more">+{products.length - 3}</div>}</div><div className="order-product-summary"><strong>{products.length ? (products[0].productId?.name || products[0].name || "Product") : "Order items"}{products.length > 1 ? ` and ${products.length - 1} more` : ""}</strong><span>{products.reduce((sum, item) => sum + Number(item.quantity || 1), 0)} item(s){products[0]?.size ? ` · Size ${products[0].size}` : ""}</span></div></div><div className="order-total"><small>ORDER TOTAL</small><strong>{money(order.totalAmount)}</strong><span className={`payment-state ${String(order.paymentStatus).toLowerCase()}`}>{order.paymentStatus || "Payment pending"}</span></div></div>
                  {order.shipping?.awb && <div className="order-shipping-strip"><span className="shipping-strip-icon">↗</span><div><small>EKART TRACKING</small><strong>AWB {order.shipping.awb}</strong></div><span className={`order-status-pill status-${statusClass(order.shipping.status || "Shipped")}`}>{order.shipping.status || "Shipped"}</span></div>}
                  <div className="order-card-actions"><button className="order-details-btn" onClick={() => setExpandedId(expanded ? null : order._id)}>{expanded ? "Hide order details" : "View order details"}<span>{expanded ? "↑" : "↓"}</span></button><div className="order-secondary-actions">{order.shipping?.awb && <button onClick={() => setExpandedId(expanded ? null : order._id)}>Track package ↗</button>}{canCancel && <button className="order-cancel-btn" disabled={busyId === order._id} onClick={() => handleOrderAction(order, "cancel")}>{busyId === order._id ? "Updating…" : "Cancel order"}</button>}</div></div>
                  {expanded && <div className="order-details-panel">
                    <div className="order-detail-grid">
                      <section className="order-detail-block"><h3><span>▤</span> Items ordered</h3>{products.length ? products.map((item, index) => { const product = item.productId && typeof item.productId === "object" ? item.productId : item; return <div className="order-line-item" key={`${order._id}-line-${index}`}><div className="order-line-thumb">{(product?.image || product?.imageUrl || product?.images?.[0]) ? <img src={product.image || product.imageUrl || product.images[0]} alt={product.name || "Product"}/> : "◇"}</div><div className="order-line-info"><strong>{product?.name || "Product"}</strong><span>Qty: {item.quantity || 1}{item.size ? ` · Size: ${item.size}` : ""}</span></div><strong>{money(Number(item.price || product?.price || 0) * Number(item.quantity || 1))}</strong></div>; }) : <p className="order-muted">Item details are not available.</p>}</section>
                      <section className="order-detail-block"><h3><span>⌖</span> Delivery address</h3><strong>{order.addressId?.name || "Recipient"}</strong><p>{fullAddress(order.addressId)}</p>{order.addressId?.phone && <p>Phone: {order.addressId.phone}</p>}<div className="order-detail-divider"/><h3><span>₹</span> Payment details</h3><div className="order-info-row"><span>Payment method</span><strong>{order.paymentMethod || "—"}</strong></div><div className="order-info-row"><span>Payment status</span><strong className={`payment-state ${String(order.paymentStatus).toLowerCase()}`}>{order.paymentStatus || "Pending"}</strong></div>{order.paymentId && <div className="order-info-row"><span>Payment reference</span><strong className="order-payment-id">{order.paymentId}</strong></div>}<div className="order-info-row order-grand-total"><span>Total paid / due</span><strong>{money(order.totalAmount)}</strong></div></section>
                    </div>
                    <section className="order-detail-block order-delivery-block"><h3><span>↗</span> Delivery progress</h3><div className="order-progress-track">{["Processing", "Shipped", "Delivered"].map((step, index) => { const current = String(order.shipping?.status || order.orderStatus || "Processing"); const stepIndex = /deliver/i.test(current) ? 2 : /ship|transit|out for/i.test(current) ? 1 : 0; const done = index <= stepIndex && !/cancel/i.test(current); return <div className={`order-progress-step ${done ? "complete" : ""}`} key={step}><span>{done ? "✓" : index + 1}</span><strong>{step}</strong></div>; })}</div>{order.shipping?.awb ? <div className="order-info-row"><span>Carrier / AWB</span><strong>{order.shipping.carrier || "Ekart"} · {order.shipping.awb}</strong></div> : <p className="order-muted">Tracking will be available once the order has been dispatched.</p>}{order.shipping?.lastTrackedAt && <p className="order-muted">Last updated {dateText(order.shipping.lastTrackedAt)}</p>}{Array.isArray(order.shipping?.history) && order.shipping.history.length > 0 && <div className="order-tracking-history">{[...order.shipping.history].sort((a,b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)).map((event, index) => <div className="order-tracking-event" key={`${order._id}-event-${index}`}><span className="tracking-event-dot"/><div><strong>{event.status || "Shipment update"}</strong>{event.description && <p>{event.description}</p>}<small>{[event.location, dateText(event.timestamp)].filter(Boolean).join(" · ")}</small></div></div>)}</div>}</section>
                    {order.orderStatus === "Delivered" && <div className="order-post-delivery-actions"><button disabled={busyId === order._id} onClick={() => handleOrderAction(order, "return")}>Request return</button><button disabled={busyId === order._id} onClick={() => handleOrderAction(order, "exchange")}>Request exchange</button></div>}
                  </div>}
                </article>;
              })}
            </div>}
          </section>
          <p className="orders-help-note">Need help with an order? Keep your order number handy when contacting customer support.</p>
        </main>
      </div>
    </div>
  );
}

"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../lib/axiosInstance";
export default function MyOrdersPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [userId, setUserId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    products: [],
    totalAmount: 0,
    addressId: "",
    paymentId: "",
  });
  const [trackOrderId, setTrackOrderId] = useState(null);
  const [actionOrderId, setActionOrderId] = useState(null);
  const [actionType, setActionType] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const decoded = jwtDecode(token);
    const userId = decoded.id;
    setUserId(userId);
    api.get(`/users?_id=${userId}`)
      .then((res) => setUsers(res.data));
    api.get(`/order?userId=${userId}`)
      .then((res) => setOrders(res.data));
  }, []);

  // Add order form handlers (for demo, minimal fields)
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddOrder = async (e) => {
    e.preventDefault();
    if (!userId) return;
    try {
      const res = await api.post("/order", { ...form, userId });
      setOrders((prev) => [...prev, res.data]);
      setShowForm(false);
      setForm({ products: [], totalAmount: 0, addressId: "", paymentId: "" });
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to add order");
    }
  };

  const handleOrderAction = async (_id, type) => {
    let orderStatus = "";
    if (type === "cancel") orderStatus = "Cancelled";
    if (type === "return") orderStatus = "Returned";
    if (type === "exchange") orderStatus = "Exchange Requested";
    if (!orderStatus) return;
    try {
      const res = await api.put("/order", { _id, orderStatus });
      setOrders((prev) => prev.map(o => o._id === _id ? res.data : o));
    } catch (err) {
      alert("Failed to update order");
    }
  };
    
  return (
    <div className="account-container">
      {/* LEFT SIDEBAR */}
      <aside className="account-sidebar">
        <div className="profile-card">
          <div className="avatar">👤</div>
          <h4>{users[0]?.firstName} {users[0]?.lastName}</h4>
          <p className="email">{users[0]?.email}</p>

          {/* <div className="progress">
            <div className="progress-bar" style={{ width: "66%" }}></div>
          </div>
          <span className="progress-text">66.67% Completed</span>

          <a href="#" className="complete-profile">
            Complete profile for better suggestions
          </a> */}
        </div>

        <ul className="menu">
          <li className={pathname === "/myaccount" ? "active" : ""}
              onClick={() => router.push("myaccount")}>My Profile</li>
          <li 
              className={pathname === "/myorders" ? "active" : ""}
              onClick={() => router.push("myorders")}>My Orders</li>
          {/* <li 
              className={pathname === "/mywishlist" ? "active" : ""}
              onClick={() => router.push("mywishlist")}>My Wishlist</li> */}
          <li 
              className={pathname === "/myaddress" ? "active" : ""}
              onClick={() => router.push("myaddress")}>My Addresses</li>
          <li 
              className={pathname === "/mybank" ? "active" : ""}
              onClick={() => router.push("mybank")}>My Bank Account</li>
        </ul>
      </aside>

      {/* RIGHT CONTENT */}
      <main className="account-content">

        <h2>MY ORDERS</h2>

        <button onClick={() => setShowForm(v => !v)} style={{marginBottom: 16}}>
          {showForm ? "Cancel" : "Add New Order"}
        </button>

        {showForm && (
          <form className="order-form" onSubmit={handleAddOrder} style={{marginBottom: 24, background: '#f9f9f9', padding: 16, borderRadius: 8}}>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: 12}}>
              <input
                name="products"
                placeholder="Product IDs (comma separated)"
                value={form.products}
                onChange={e => setForm(f => ({ ...f, products: e.target.value.split(',').map(s => s.trim()) }))}
                required
                style={{flex: 2}}
              />
              <input
                name="totalAmount"
                placeholder="Total Amount"
                type="number"
                value={form.totalAmount}
                onChange={handleFormChange}
                required
                style={{flex: 1}}
              />
              <input
                name="addressId"
                placeholder="Address ID"
                value={form.addressId}
                onChange={handleFormChange}
                required
                style={{flex: 1}}
              />
              <input
                name="paymentId"
                placeholder="Payment ID (optional)"
                value={form.paymentId}
                onChange={handleFormChange}
                style={{flex: 1}}
              />
            </div>
            <button type="submit" style={{marginTop: 12}}>Save Order</button>
          </form>
        )}

        {/* List of orders */}
        <section className="info-section">
          <div className="section-header">
            <h3>Order History</h3>
          </div>
          {orders.length === 0 ? (
            <p style={{ color: '#888' }}>No orders found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {orders.map(order => (
                <div key={order._id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>Order #{order.orderId || order._id.slice(-6)}</strong> - <span style={{ color: '#1890ff' }}>{order.orderStatus}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#888' }}>₹{order.totalAmount}</div>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    Products: {order.products?.map(p => p.productId?.name || p.productId || p).join(', ')}
                  </div>
                  <div style={{ marginTop: 4 }}>Address: {order.addressId?.street || order.addressId || "-"}</div>
                  <div style={{ marginTop: 4, fontSize: 13, color: '#888' }}>Placed: {new Date(order.createdAt).toLocaleString()}</div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <button onClick={() => setTrackOrderId(order._id)} style={{ fontSize: 13 }}>Track</button>
                    <button onClick={() => handleOrderAction(order._id, "cancel")} style={{ fontSize: 13, color: 'red' }} disabled={order.orderStatus === 'Cancelled'}>Cancel</button>
                    <button onClick={() => handleOrderAction(order._id, "return")} style={{ fontSize: 13 }} disabled={order.orderStatus === 'Returned'}>Return</button>
                    <button onClick={() => handleOrderAction(order._id, "exchange")} style={{ fontSize: 13 }} disabled={order.orderStatus === 'Exchange Requested'}>Exchange</button>
                  </div>
                  {trackOrderId === order._id && (
                    <div style={{ marginTop: 8, background: '#f0f5ff', padding: 8, borderRadius: 6 }}>
                      <strong>Tracking:</strong> Status: {order.orderStatus} <br />
                      {/* Add more tracking info here if available */}
                      <button onClick={() => setTrackOrderId(null)} style={{ fontSize: 13, marginTop: 4 }}>Close</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

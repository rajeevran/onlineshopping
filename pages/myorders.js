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
    <div className="account-container" style={{maxWidth: 900, margin: "40px auto", background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.08)", padding: 32, fontFamily: 'Segoe UI, Arial, sans-serif'}}>
      {/* LEFT SIDEBAR */}
      <aside className="account-sidebar" style={{float: "left", width: 220, marginRight: 32}}>
        <div className="profile-card" style={{background: "#f7f7fa", borderRadius: 12, padding: 24, textAlign: "center", marginBottom: 24}}>
          <div className="avatar" style={{fontSize: 48, marginBottom: 8}}>👤</div>
          <h4 style={{margin: "8px 0", fontWeight: 600}}>{users[0]?.firstName} {users[0]?.lastName}</h4>
          <p className="email" style={{color: "#888", fontSize: 15}}>{users[0]?.email}</p>
        </div>
        <ul className="menu" style={{listStyle: "none", padding: 0, margin: 0}}>
          <li className={pathname === "/myaccount" ? "active" : ""} style={{padding: "10px 0", cursor: "pointer", fontWeight: pathname === "/myaccount" ? 600 : 400, color: pathname === "/myaccount" ? "#0070f3" : "#333"}}
              onClick={() => router.push("myaccount")}>My Profile</li>
          <li className={pathname === "/myorders" ? "active" : ""} style={{padding: "10px 0", cursor: "pointer", fontWeight: pathname === "/myorders" ? 600 : 400, color: pathname === "/myorders" ? "#0070f3" : "#333"}}
              onClick={() => router.push("myorders")}>My Orders</li>
          <li className={pathname === "/myaddress" ? "active" : ""} style={{padding: "10px 0", cursor: "pointer", fontWeight: pathname === "/myaddress" ? 600 : 400, color: pathname === "/myaddress" ? "#0070f3" : "#333"}}
              onClick={() => router.push("myaddress")}>My Addresses</li>
          <li className={pathname === "/mybank" ? "active" : ""} style={{padding: "10px 0", cursor: "pointer", fontWeight: pathname === "/mybank" ? 600 : 400, color: pathname === "/mybank" ? "#0070f3" : "#333"}}
              onClick={() => router.push("mybank")}>My Bank Account</li>
        </ul>
      </aside>
      {/* RIGHT CONTENT */}
      <main className="account-content" style={{overflow: "hidden"}}>
        <h2 style={{fontWeight: 700, fontSize: 28, marginBottom: 24}}>MY ORDERS</h2>
       {/* <button onClick={() => setShowForm(v => !v)} style={{marginBottom: 16, background: "#0070f3", color: "#fff", border: "none", borderRadius: 6, padding: "8px 20px", fontWeight: 500}}>
          {showForm ? "Cancel" : "Add New Order"}
        </button>*/}
        {showForm && (
          <form className="order-form" onSubmit={handleAddOrder} style={{marginBottom: 24, background: '#f9f9f9', padding: 20, borderRadius: 8}}>
            <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 20}}>
              <div>
                <label style={{display: 'block', fontWeight: 500, marginBottom: 6}}>Product IDs (comma separated)</label>
                <input name="products" placeholder="Product IDs (comma separated)" value={form.products} onChange={e => setForm(f => ({ ...f, products: e.target.value.split(',').map(s => s.trim()) }))} required style={{width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc'}} />
              </div>
              <div>
                <label style={{display: 'block', fontWeight: 500, marginBottom: 6}}>Total Amount</label>
                <input name="totalAmount" placeholder="Total Amount" type="number" value={form.totalAmount} onChange={handleFormChange} required style={{width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc'}} />
              </div>
              <div>
                <label style={{display: 'block', fontWeight: 500, marginBottom: 6}}>Address ID</label>
                <input name="addressId" placeholder="Address ID" value={form.addressId} onChange={handleFormChange} required style={{width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc'}} />
              </div>
              <div>
                <label style={{display: 'block', fontWeight: 500, marginBottom: 6}}>Payment ID (optional)</label>
                <input name="paymentId" placeholder="Payment ID (optional)" value={form.paymentId} onChange={handleFormChange} style={{width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc'}} />
              </div>
            </div>
            <button type="submit" style={{marginTop: 12, background: "#0070f3", color: "#fff", border: "none", borderRadius: 6, padding: "8px 20px", fontWeight: 500}}>Save Order</button>
          </form>
        )}
        {/* List of orders */}
        <section className="info-section" style={{background: '#f7f7fa', borderRadius: 12, padding: 24}}>
          <div className="section-header" style={{marginBottom: 16}}>
            <h3 style={{margin: 0, fontWeight: 600}}>Order History</h3>
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
                    <button onClick={() => setTrackOrderId(order._id)} style={{ fontSize: 13, background: '#eee', borderRadius: 6, border: 'none', padding: '4px 12px' }}>Track</button>
                    <button onClick={() => handleOrderAction(order._id, "cancel")} style={{ fontSize: 13, color: 'red', background: '#eee', borderRadius: 6, border: 'none', padding: '4px 12px' }} disabled={order.orderStatus === 'Cancelled'}>Cancel</button>
                    <button onClick={() => handleOrderAction(order._id, "return")} style={{ fontSize: 13, background: '#eee', borderRadius: 6, border: 'none', padding: '4px 12px' }} disabled={order.orderStatus === 'Returned'}>Return</button>
                    <button onClick={() => handleOrderAction(order._id, "exchange")} style={{ fontSize: 13, background: '#eee', borderRadius: 6, border: 'none', padding: '4px 12px' }} disabled={order.orderStatus === 'Exchange Requested'}>Exchange</button>
                  </div>
                  {trackOrderId === order._id && (
                    <div style={{ marginTop: 8, background: '#f0f5ff', padding: 8, borderRadius: 6 }}>
                      <strong>Tracking:</strong> Status: {order.orderStatus} <br />
                      {/* Add more tracking info here if available */}
                      <button onClick={() => setTrackOrderId(null)} style={{ fontSize: 13, marginTop: 4, background: '#eee', borderRadius: 6, border: 'none', padding: '4px 12px' }}>Close</button>
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

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/axiosInstance";
import { jwtDecode } from "jwt-decode";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [viewOrderId, setViewOrderId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }
    const decoded = jwtDecode(token);
    if (decoded.role !== "admin") {
      router.replace("/");
      return;
    }
    setIsAdmin(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
        const usersRes = await api.get("/users");
        console.log('usersRes',usersRes);
        const ordersRes = await api.get("/order");
        
    //   const [ordersRes, usersRes] = await Promise.all([
    //     api.get("/order"),
    //     api.get("/users")
    //   ]);
      setOrders(ordersRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      setMessage("Failed to fetch data");
    }
    setLoading(false);
  };

  const handleOrderStatus = async (orderId, status) => {
    try {
      await api.put("/order", { _id: orderId, orderStatus: status });
      setOrders(orders => orders.map(o => o._id === orderId ? { ...o, orderStatus: status } : o));
      setMessage("Order status updated");
    } catch {
      setMessage("Failed to update order status");
    }
  };

  const handleUserEdit = async (userId, data) => {
    try {
      await api.put(`/users/${userId}`, data);
      setMessage("User updated");
      fetchData();
    } catch {
      setMessage("Failed to update user");
    }
  };

  const handleUserDelete = async (userId) => {
    if (!window.confirm("Delete this user and all their orders?")) return;
    try {
      await api.delete("/users", { data: { _id: userId } });
      setMessage("User deleted");
      fetchData();
    } catch {
      setMessage("Failed to delete user");
    }
  };

  if (!isAdmin) return null;
  if (loading) return <div>Loading...</div>;

  return (
    <div style={{maxWidth: 1100, margin: "40px auto", background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.08)", padding: 32, fontFamily: 'Segoe UI, Arial, sans-serif'}}>
      <h2 style={{fontWeight: 700, fontSize: 28, marginBottom: 24, color: '#0070f3'}}>Admin Dashboard</h2>
      {message && <div style={{color: message.includes("Failed") ? "red" : "green", marginBottom: 16}}>{message}</div>}
      <section style={{marginBottom: 40}}>
        <h3 style={{fontWeight: 600, color: '#333'}}>All Orders</h3>
        <table style={{width: "100%", borderCollapse: "collapse", marginTop: 12, background: '#f7f7fa', borderRadius: 8, overflow: 'hidden'}}>
          <thead>
            <tr style={{background: "#eaf3fb"}}>
              <th style={{padding: '10px'}}>Order ID</th>
              <th style={{padding: '10px'}}>User</th>
              <th style={{padding: '10px'}}>Status</th>
              <th style={{padding: '10px'}}>Amount</th>
              <th style={{padding: '10px'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id} style={{borderBottom: "1px solid #eee", background: viewOrderId === order._id ? '#f0f5ff' : '#fff'}}>
                <td style={{padding: '10px','text-align': 'center'}}>{order.orderId || order._id.slice(-6)}</td>
                <td style={{padding: '10px','text-align': 'center'}}>{users.find(u => u._id === order.userId)?.email || order.userId}</td>
                <td style={{padding: '10px','text-align': 'center'}}>
                  <select value={order.orderStatus} onChange={e => handleOrderStatus(order._id, e.target.value)} style={{padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc'}}>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </td>
                <td style={{padding: '10px','text-align': 'center'}}>₹{order.totalAmount}</td>
                <td style={{padding: '10px','text-align': 'center'}}>
                  <button onClick={() => setViewOrderId(order._id)} style={{background: '#0070f3', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 500}}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {viewOrderId && (
          <div style={{marginTop: 24, background: '#f0f5ff', borderRadius: 8, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)'}}>
            <h4 style={{fontWeight: 600, marginBottom: 12}}>Order Details</h4>
            {(() => {
              const order = orders.find(o => o._id === viewOrderId);
              if (!order) return null;
              return (
                <div>
                  <div><strong>Order ID:</strong> {order.orderId || order._id}</div>
                  <div><strong>User:</strong> {users.find(u => u._id === order.userId)?.email || order.userId}</div>
                  <div><strong>Status:</strong> {order.orderStatus}</div>
                  <div><strong>Amount:</strong> ₹{order.totalAmount}</div>
                  <div><strong>Payment Status:</strong> {order.paymentStatus}</div>
                  <div><strong>Address:</strong> {order.addressId?.street || order.addressId || '-'}</div>
                  <div><strong>Products:</strong>
                    <ul style={{marginLeft: 16}}>
                      {order.products?.map((p, idx) => (
                        <li key={idx}>
                          {p.productId?.name || p.productId || 'Product'} - Qty: {p.quantity}, Price: ₹{p.price}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button onClick={() => setViewOrderId(null)} style={{marginTop: 16, background: '#eee', color: '#333', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 500}}>Close</button>
                </div>
              );
            })()}
          </div>
        )}
      </section>
      <section>
        <h3 style={{fontWeight: 600, color: '#333'}}>All Users</h3>
        <table style={{width: "100%", borderCollapse: "collapse", marginTop: 12, background: '#f7f7fa', borderRadius: 8, overflow: 'hidden'}}>
          <thead>
            <tr style={{background: "#eaf3fb"}}>
              <th style={{padding: '10px'}}>Email</th>
              <th style={{padding: '10px'}}>Name</th>
              <th style={{padding: '10px'}}>Role</th>
              <th style={{padding: '10px'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id} style={{borderBottom: "1px solid #eee"}}>
                <td style={{padding: '10px','text-align': 'center'}}>{user.email}</td>
                <td style={{padding: '10px','text-align': 'center'}}>{user.firstName} {user.lastName}</td>
                <td style={{padding: '10px','text-align': 'center'}}>{user.role}</td>
                <td style={{padding: '10px','text-align': 'center'}}>
                  {/* <button onClick={() => handleUserEdit(user._id, { role: user.role === "admin" ? "user" : "admin" })} style={{marginRight: 8, background: '#eee', borderRadius: 6, border: 'none', padding: '4px 12px'}}>Toggle Role</button> */}
                  <button onClick={() => handleUserDelete(user._id)} style={{color: 'red', background: '#eee', borderRadius: 6, border: 'none', padding: '4px 12px'}}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

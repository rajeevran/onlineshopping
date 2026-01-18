"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../lib/axiosInstance";

export default function MyAddressPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [users, setUsers] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const decoded = jwtDecode(token);
    const userId = decoded.id;
    setUserId(userId);
    api.get(`/users?_id=${userId}`)
      .then((res) => setUsers(res.data));
    api.get(`/address?userId=${userId}`)
      .then((res) => setAddresses(res.data));
  }, []);

  // For debug
  // console.log('users', users);
  // console.log('addresses', addresses);
    
  // Address form state
  const [form, setForm] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false,
  });
  const [showForm, setShowForm] = useState(false);


  const [editId, setEditId] = useState(null);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;
    try {
      if (editId) {
        // Edit address
        const res = await api.put("/address", { ...form, userId, _id: editId });
        setAddresses((prev) => prev.map(a => a._id === editId ? res.data : a));
        setEditId(null);
      } else {
        // Add new address
        const res = await api.post("/address", { ...form, userId });
        setAddresses((prev) => [...prev, res.data]);
      }
      setForm({ name: "", phone: "", street: "", city: "", state: "", pincode: "", isDefault: false });
      setShowForm(false);
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to save address");
    }
  };

  const handleEdit = (addr) => {
    setForm({
      name: addr.name,
      phone: addr.phone,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      isDefault: addr.isDefault,
    });
    setEditId(addr._id);
    setShowForm(true);
  };

  const handleDelete = async (_id) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await api.delete("/address", { data: { _id, userId } });
      setAddresses((prev) => prev.filter(a => a._id !== _id));
    } catch (err) {
      alert("Failed to delete address");
    }
  };

  const handleSetDefault = async (_id) => {
    try {
      const addr = addresses.find(a => a._id === _id);
      if (!addr) return;
      const res = await api.put("/address", { ...addr, userId, _id, isDefault: true });
      setAddresses((prev) => prev.map(a => a._id === _id ? res.data : { ...a, isDefault: false }));
    } catch (err) {
      alert("Failed to set default");
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
        <h2 style={{fontWeight: 700, fontSize: 28, marginBottom: 24}}>MY ADDRESS</h2>
        <button onClick={() => setShowForm((v) => !v)} style={{marginBottom: 16, background: "#0070f3", color: "#fff", border: "none", borderRadius: 6, padding: "8px 20px", fontWeight: 500}}>
          {showForm ? "Cancel" : "Add New Address"}
        </button>
        {showForm && (
          <form className="address-form" onSubmit={handleFormSubmit} style={{marginBottom: 24, background: '#f9f9f9', padding: 20, borderRadius: 8}}>
            <div >
              <div>
                <label style={{display: 'block', fontWeight: 500, marginBottom: 6}}>Full Name</label>
                <input name="name" placeholder="Full Name" value={form.name} onChange={handleFormChange} required style={{width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc'}} />
              </div>
              <div>
                <label style={{display: 'block', fontWeight: 500, marginBottom: 6}}>Phone</label>
                <input name="phone" placeholder="Phone" value={form.phone} onChange={handleFormChange} required style={{width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc'}} />
              </div>
              <div>
                <label style={{display: 'block', fontWeight: 500, marginBottom: 6}}>Street Address</label>
                <input name="street" placeholder="Street Address" value={form.street} onChange={handleFormChange} required style={{width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc'}} />
              </div>
              <div>
                <label style={{display: 'block', fontWeight: 500, marginBottom: 6}}>City</label>
                <input name="city" placeholder="City" value={form.city} onChange={handleFormChange} required style={{width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc'}} />
              </div>
              <div>
                <label style={{display: 'block', fontWeight: 500, marginBottom: 6}}>State</label>
                <input name="state" placeholder="State" value={form.state} onChange={handleFormChange} required style={{width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc'}} />
              </div>
              <div>
                <label style={{display: 'block', fontWeight: 500, marginBottom: 6}}>Pincode</label>
                <input name="pincode" placeholder="Pincode" value={form.pincode} onChange={handleFormChange} required style={{width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc'}} />
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <input type="checkbox" name="isDefault" checked={form.isDefault} onChange={handleFormChange} />
                <span>Set as default</span>
              </div>
            </div>
            <button type="submit" style={{marginTop: 12, background: "#0070f3", color: "#fff", border: "none", borderRadius: 6, padding: "8px 20px", fontWeight: 500}}>{editId ? "Update Address" : "Save Address"}</button>
          </form>
        )}
        {/* List of addresses */}
        <section className="info-section" style={{background: '#f7f7fa', borderRadius: 12, padding: 24}}>
          <div className="section-header" style={{marginBottom: 16}}>
            <h3 style={{margin: 0, fontWeight: 600}}>Saved Addresses</h3>
          </div>
          {addresses.length === 0 ? (
            <p style={{ color: '#888' }}>No addresses added yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {addresses.map(addr => (
                <div key={addr._id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, background: addr.isDefault ? '#e6f7ff' : '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{addr.name}</strong> {addr.isDefault && <span style={{ color: '#1890ff', fontWeight: 500 }}>(Default)</span>}
                    </div>
                    <div style={{ fontSize: 13, color: '#888' }}>{addr.phone}</div>
                  </div>
                  <div style={{ marginTop: 4 }}>{addr.street}, {addr.city}, {addr.state} - {addr.pincode}</div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <button onClick={() => handleEdit(addr)} style={{ fontSize: 13, background: '#eee', borderRadius: 6, border: 'none', padding: '4px 12px' }}>Edit</button>
                    <button onClick={() => handleDelete(addr._id)} style={{ fontSize: 13, color: 'red', background: '#eee', borderRadius: 6, border: 'none', padding: '4px 12px' }}>Delete</button>
                    {!addr.isDefault && (
                      <button onClick={() => handleSetDefault(addr._id)} style={{ fontSize: 13, background: '#eee', borderRadius: 6, border: 'none', padding: '4px 12px' }}>Set Default</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

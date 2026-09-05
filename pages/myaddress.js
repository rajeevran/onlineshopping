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
    <div className="account-page">
      <div className="account-container">
        <aside className="account-sidebar">
          <div className="profile-card">
            <div className="avatar">👤</div>
            <h4>{users[0]?.firstName || "My"} {users[0]?.lastName || "Account"}</h4>
            <p className="email">{users[0]?.email || ""}</p>
          </div>

          <nav className="account-menu" aria-label="Account navigation">
            <button className={pathname === "/myaccount" ? "active" : ""} onClick={() => router.push("/myaccount")}>
              <span>👤</span><span>My Profile</span>
            </button>
            <button className={pathname === "/myorders" ? "active" : ""} onClick={() => router.push("/myorders")}>
              <span>📦</span><span>My Orders</span>
            </button>
            <button className={pathname === "/myaddress" ? "active" : ""} onClick={() => router.push("/myaddress")}>
              <span>📍</span><span>My Addresses</span>
            </button>
            <button className={pathname === "/mybank" ? "active" : ""} onClick={() => router.push("/mybank")}>
              <span>🏦</span><span>My Bank Account</span>
            </button>
          </nav>
        </aside>
      <main className="account-content">
        <div className="account-title-row">
            <div>
              <p className="account-eyebrow">MY ADDRESS</p>
              <h4>Communication Addresses</h4>
            </div>
            <div className="account-user-mobile">
              <div className="mobile-avatar">👤</div>
              <span>{users[0]?.firstName || "Account"}</span>
            </div>
          </div>
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
          <section className="account-section">
            <div className="section-header">
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
    </div>
  );
}

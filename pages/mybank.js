"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../lib/axiosInstance";
export default function MyBankPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [users, setUsers] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [userId, setUserId] = useState("");
  const [form, setForm] = useState({
    accountHolder: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    isDefault: false,
  });
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const decoded = jwtDecode(token);
    const userId = decoded.id;
    setUserId(userId);
    api.get(`/users?_id=${userId}`)
      .then((res) => setUsers(res.data));
    api.get(`/bank?userId=${userId}`)
      .then((res) => setBankAccounts(res.data));
  }, []);

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
        const res = await api.put("/bank", { ...form, userId, _id: editId });
        setBankAccounts((prev) => prev.map(a => a._id === editId ? res.data : a));
        setEditId(null);
      } else {
        const res = await api.post("/bank", { ...form, userId });
        setBankAccounts((prev) => [...prev, res.data]);
      }
      setForm({ accountHolder: "", bankName: "", accountNumber: "", ifsc: "", isDefault: false });
      setShowForm(false);
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to save bank account");
    }
  };

  const handleEdit = (bank) => {
    setForm({
      accountHolder: bank.accountHolder,
      bankName: bank.bankName,
      accountNumber: bank.accountNumber,
      ifsc: bank.ifsc,
      isDefault: bank.isDefault,
    });
    setEditId(bank._id);
    setShowForm(true);
  };

  const handleDelete = async (_id) => {
    if (!window.confirm("Delete this bank account?")) return;
    try {
      await api.delete("/bank", { data: { _id, userId } });
      setBankAccounts((prev) => prev.filter(a => a._id !== _id));
    } catch (err) {
      alert("Failed to delete bank account");
    }
  };

  const handleSetDefault = async (_id) => {
    try {
      const bank = bankAccounts.find(a => a._id === _id);
      if (!bank) return;
      const res = await api.put("/bank", { ...bank, userId, _id, isDefault: true });
      setBankAccounts((prev) => prev.map(a => a._id === _id ? res.data : { ...a, isDefault: false }));
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
              <p className="account-eyebrow">MY BANK ACCOUNTS</p>
              <h4>My All Bank Accounts details</h4>
            </div>
            <div className="account-user-mobile">
              <div className="mobile-avatar">👤</div>
              <span>{users[0]?.firstName || "Account"}</span>
            </div>
          </div>
        <span className="account-eyebrow" onClick={() => { setShowForm(v => !v); setEditId(null); setForm({ accountHolder: "", bankName: "", accountNumber: "", ifsc: "", isDefault: false }); }} >
          {showForm ? "Cancel" : "+ Add Bank Account"}
        </span>
        {showForm && (
          <form className="bank-form" onSubmit={handleFormSubmit} style={{marginBottom: 24, background: '#f9f9f9', padding: 20, borderRadius: 8}}>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20}}>
              <div>
                <label style={{display: 'block', fontWeight: 500, marginBottom: 6}}>Account Holder</label>
                <input name="accountHolder" placeholder="Account Holder" value={form.accountHolder} onChange={handleFormChange} required style={{width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc'}} />
              </div>
              <div>
                <label style={{display: 'block', fontWeight: 500, marginBottom: 6}}>Bank Name</label>
                <input name="bankName" placeholder="Bank Name" value={form.bankName} onChange={handleFormChange} required style={{width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc'}} />
              </div>
              <div>
                <label style={{display: 'block', fontWeight: 500, marginBottom: 6}}>Account Number</label>
                <input name="accountNumber" placeholder="Account Number" value={form.accountNumber} onChange={handleFormChange} required style={{width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc'}} />
              </div>
              <div>
                <label style={{display: 'block', fontWeight: 500, marginBottom: 6}}>IFSC Code</label>
                <input name="ifsc" placeholder="IFSC Code" value={form.ifsc} onChange={handleFormChange} required style={{width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc'}} />
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <input type="checkbox" name="isDefault" checked={form.isDefault} onChange={handleFormChange} />
                <span>Set as default</span>
              </div>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 8, marginTop: 16}}>

              <button type="submit" className="primary-btn">
              {editId ? "Update Bank Account" : "Save Bank Account"}
              </button>
            </div>
          </form>
        )}
        {/* List of bank accounts */}
          <section className="account-section">
            <div className="section-header">
            <h3 style={{margin: 0, fontWeight: 600}}>Saved Bank Accounts</h3>
          </div>
          {bankAccounts.length === 0 ? (
            <p style={{ color: '#888' }}>No bank accounts added yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {bankAccounts.map(bank => (
                <div key={bank._id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, background: bank.isDefault ? '#e6f7ff' : '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{bank.accountHolder}</strong> {bank.isDefault && <span style={{ color: '#1890ff', fontWeight: 500 }}>(Default)</span>}
                    </div>
                    <div style={{ fontSize: 13, color: '#888' }}>{bank.bankName}</div>
                  </div>
                  <div style={{ marginTop: 4 }}>A/C: ****{bank.accountNumber?.slice(-4)} | IFSC: {bank.ifsc}</div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <button onClick={() => handleEdit(bank)} className="primary-btn">Edit</button>
                    <button onClick={() => handleDelete(bank._id)} className="secondary-btn">Delete</button>
                    {!bank.isDefault && (
                      <button onClick={() => handleSetDefault(bank._id)} className="secondary-btn">Set Default</button>
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

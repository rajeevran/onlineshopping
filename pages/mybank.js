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
        <h2 style={{fontWeight: 700, fontSize: 28, marginBottom: 24}}>MY BANK ACCOUNTS</h2>
        <button onClick={() => { setShowForm(v => !v); setEditId(null); setForm({ accountHolder: "", bankName: "", accountNumber: "", ifsc: "", isDefault: false }); }} style={{marginBottom: 16, background: "#0070f3", color: "#fff", border: "none", borderRadius: 6, padding: "8px 20px", fontWeight: 500}}>
          {showForm ? "Cancel" : "Add New Bank Account"}
        </button>
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
            <button type="submit" style={{marginTop: 12, background: "#0070f3", color: "#fff", border: "none", borderRadius: 6, padding: "8px 20px", fontWeight: 500}}>{editId ? "Update Bank Account" : "Save Bank Account"}</button>
          </form>
        )}
        {/* List of bank accounts */}
        <section className="info-section" style={{background: '#f7f7fa', borderRadius: 12, padding: 24}}>
          <div className="section-header" style={{marginBottom: 16}}>
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
                    <button onClick={() => handleEdit(bank)} style={{ fontSize: 13, background: '#eee', borderRadius: 6, border: 'none', padding: '4px 12px' }}>Edit</button>
                    <button onClick={() => handleDelete(bank._id)} style={{ fontSize: 13, color: 'red', background: '#eee', borderRadius: 6, border: 'none', padding: '4px 12px' }}>Delete</button>
                    {!bank.isDefault && (
                      <button onClick={() => handleSetDefault(bank._id)} style={{ fontSize: 13, background: '#eee', borderRadius: 6, border: 'none', padding: '4px 12px' }}>Set Default</button>
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

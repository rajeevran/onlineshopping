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

        <h2>MY BANK ACCOUNTS</h2>

        <button onClick={() => { setShowForm(v => !v); setEditId(null); setForm({ accountHolder: "", bankName: "", accountNumber: "", ifsc: "", isDefault: false }); }} style={{marginBottom: 16}}>
          {showForm ? "Cancel" : "Add New Bank Account"}
        </button>

        {showForm && (
          <form className="bank-form" onSubmit={handleFormSubmit} style={{marginBottom: 24, background: '#f9f9f9', padding: 16, borderRadius: 8}}>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: 12}}>
              <input
                name="accountHolder"
                placeholder="Account Holder"
                value={form.accountHolder}
                onChange={handleFormChange}
                required
                style={{flex: 1}}
              />
              <input
                name="bankName"
                placeholder="Bank Name"
                value={form.bankName}
                onChange={handleFormChange}
                required
                style={{flex: 1}}
              />
              <input
                name="accountNumber"
                placeholder="Account Number"
                value={form.accountNumber}
                onChange={handleFormChange}
                required
                style={{flex: 1}}
              />
              <input
                name="ifsc"
                placeholder="IFSC Code"
                value={form.ifsc}
                onChange={handleFormChange}
                required
                style={{flex: 1}}
              />
              <label style={{display: 'flex', alignItems: 'center', gap: 4}}>
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={form.isDefault}
                  onChange={handleFormChange}
                />
                Set as default
              </label>
            </div>
            <button type="submit" style={{marginTop: 12}}>{editId ? "Update Bank Account" : "Save Bank Account"}</button>
          </form>
        )}

        {/* List of bank accounts */}
        <section className="info-section">
          <div className="section-header">
            <h3>Saved Bank Accounts</h3>
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
                    <button onClick={() => handleEdit(bank)} style={{ fontSize: 13 }}>Edit</button>
                    <button onClick={() => handleDelete(bank._id)} style={{ fontSize: 13, color: 'red' }}>Delete</button>
                    {!bank.isDefault && (
                      <button onClick={() => handleSetDefault(bank._id)} style={{ fontSize: 13 }}>Set Default</button>
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

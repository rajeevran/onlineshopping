"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {jwtDecode} from "jwt-decode";
import api from "../lib/axiosInstance";
export default function MyAccountPage() {
  const [editMode, setEditMode] = useState(false);
  const [users, setUsers] = useState([]);
  const router = useRouter();
  const pathname = usePathname();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    gender: "",
    dob: "",
    phone: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const decoded = jwtDecode(token);
    const userId = decoded.id;
    api.get(`/users?_id=${userId}`)
      .then((res) => {
        setUsers(res.data);
        if (res.data[0]) {
          setFormData({
            firstName: res.data[0].firstName || "",
            lastName: res.data[0].lastName || "",
            email: res.data[0].email || "",
            gender: res.data[0].gender || "",
            dob: res.data[0].dob ? res.data[0].dob.slice(0, 10) : "",
            phone: res.data[0].phone || ""
          });
        }
      });
  }, []);

  const handleEditClick = () => {
    setEditMode(true);
    setMessage("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage("");
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage("New passwords do not match.");
      setPasswordLoading(false);
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const decoded = jwtDecode(token);
      const userId = decoded.id;
      // Send oldPassword and newPassword to API
      const res = await api.put(`/users/${userId}`, {
        _id: userId,
        passwordHash: passwordData.newPassword
      });
      setPasswordMessage("Password changed successfully.");
      setShowPasswordForm(false);
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPasswordMessage("Failed to change password.");
    }
    setPasswordLoading(false);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      const decoded = jwtDecode(token);
      const userId = decoded.id;
      const res = await api.put(`/users/${userId}`, formData);
      setMessage("Account details updated successfully.");
      setEditMode(false);
      setUsers([res.data]);
    } catch (err) {
      setMessage("Failed to update account details.");
    }
    setLoading(false);
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
          {/* <li className={pathname === "/mywishlist" ? "active" : ""} style={{padding: "10px 0", cursor: "pointer", fontWeight: pathname === "/mywishlist" ? 600 : 400, color: pathname === "/mywishlist" ? "#0070f3" : "#333"}}
              onClick={() => router.push("mywishlist")}>My Wishlist</li> */}
          <li className={pathname === "/myaddress" ? "active" : ""} style={{padding: "10px 0", cursor: "pointer", fontWeight: pathname === "/myaddress" ? 600 : 400, color: pathname === "/myaddress" ? "#0070f3" : "#333"}}
              onClick={() => router.push("myaddress")}>My Addresses</li>
          <li className={pathname === "/mybank" ? "active" : ""} style={{padding: "10px 0", cursor: "pointer", fontWeight: pathname === "/mybank" ? 600 : 400, color: pathname === "/mybank" ? "#0070f3" : "#333"}}
              onClick={() => router.push("mybank")}>My Bank Account</li>
        </ul>
      </aside>
      {/* RIGHT CONTENT */}
      <main className="account-content" style={{overflow: "hidden"}}>
        <h2 style={{fontWeight: 700, fontSize: 28, marginBottom: 24}}>MY PROFILE</h2>
        {message && (
          <div style={{ color: message.includes("success") ? "green" : "red", marginBottom: 10 }}>{message}</div>
        )}
        {/* BASIC INFO */}
        <section className="info-section" style={{background: "#f7f7fa", borderRadius: 12, padding: 24, marginBottom: 24}}>
          <div className="section-header" style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16}}>
            <h3 style={{margin: 0, fontWeight: 600}}>BASIC INFORMATION</h3>
            {!editMode && <span className="edit" style={{cursor: "pointer", color: "#0070f3", fontWeight: 500}} onClick={handleEditClick}>Edit</span>}
          </div>
          {!editMode ? (
            <div className="info-grid" style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20}}>
              <div>
                <label>First Name</label>
                <p>{users[0]?.firstName}</p>
              </div>
              <div>
                <label>Last Name</label>
                <p>{users[0]?.lastName}</p>
              </div>
              <div>
                <label>Email</label>
                <p><strong>{users[0]?.email}</strong></p>
              </div>
              <div>
                <label>Gender</label>
                <p>{users[0]?.gender}</p>
              </div>
              <div>
                <label>Date of Birth</label>
                <p>{users[0]?.dob ? new Date(users[0]?.dob).toLocaleDateString("en-GB") : ""}</p>
              </div>
            </div>
          ) : (
            <form className="info-grid" onSubmit={handleFormSubmit} style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20}}>
              <div>
                <label style={{display: "block", fontWeight: 500, marginBottom: 6}}>First Name</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required style={{width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc"}} />
              </div>
              <div>
                <label style={{display: "block", fontWeight: 500, marginBottom: 6}}>Last Name</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required style={{width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc"}} />
              </div>
              <div>
                <label style={{display: "block", fontWeight: 500, marginBottom: 6}}>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required style={{width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc"}} />
              </div>
              <div>
                <label style={{display: "block", fontWeight: 500, marginBottom: 6}}>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange} required style={{width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc"}}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label style={{display: "block", fontWeight: 500, marginBottom: 6}}>Date of Birth</label>
                <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} required style={{width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc"}} />
              </div>
              <div style={{gridColumn: "1 / -1", textAlign: "right"}}>
                <button type="submit" disabled={loading} style={{marginRight: 8, background: "#0070f3", color: "#fff", border: "none", borderRadius: 6, padding: "8px 20px", fontWeight: 500}}>Save</button>
                <button type="button" onClick={() => setEditMode(false)} disabled={loading} style={{background: "#eee", color: "#333", border: "none", borderRadius: 6, padding: "8px 20px", fontWeight: 500}}>Cancel</button>
              </div>
            </form>
          )}
        </section>
        {/* CONTACT INFO */}
        <section className="info-section" style={{background: "#f7f7fa", borderRadius: 12, padding: 24}}>
          <div className="section-header" style={{marginBottom: 16}}>
            <h3 style={{margin: 0, fontWeight: 600}}>CONTACT INFORMATION</h3>
          </div>
          <div className="info-grid" style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20}}>
            <div>
              <label>Mobile Number</label>
              {!editMode ? (
                <p>+91 {users[0]?.phone}</p>
              ) : (
                <input style={{width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc"}} type="text" name="phone" value={formData.phone} onChange={handleInputChange} required />
              )}
            </div>
            <div>
              <label>Password</label>
              <p>********</p>
              <span className="edit" style={{cursor: "pointer", color: "#0070f3", fontWeight: 500}} onClick={() => setShowPasswordForm(true)}>Change</span>
            </div>
          </div>
          {showPasswordForm && (
            <form className="password-form" onSubmit={handlePasswordSubmit} style={{marginTop: 16, background: "#fff", borderRadius: 8, boxShadow: "0 1px 8px rgba(0,0,0,0.06)", padding: 20}}>
              <div style={{marginBottom: 16}}>
                <label style={{display: "block", fontWeight: 500, marginBottom: 6}}>New Password</label>
                <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordInputChange} required style={{width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc"}} />
              </div>
              <div style={{marginBottom: 16}}>
                <label style={{display: "block", fontWeight: 500, marginBottom: 6}}>Confirm New Password</label>
                <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordInputChange} required style={{width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc"}} />
              </div>
              <div style={{textAlign: "right"}}>
                <button type="submit" disabled={passwordLoading} style={{marginRight: 8, background: "#0070f3", color: "#fff", border: "none", borderRadius: 6, padding: "8px 20px", fontWeight: 500}}>Save</button>
                <button type="button" onClick={() => { setShowPasswordForm(false); setPasswordMessage(""); setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" }); }} disabled={passwordLoading} style={{background: "#eee", color: "#333", border: "none", borderRadius: 6, padding: "8px 20px", fontWeight: 500}}>Cancel</button>
              </div>
              {passwordMessage && (
                <div style={{ color: passwordMessage.includes("success") ? "green" : "red", marginTop: 8 }}>{passwordMessage}</div>
              )}
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

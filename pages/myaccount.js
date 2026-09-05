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
              <p className="account-eyebrow">MY ACCOUNT</p>
              <h4>My Profile</h4>
            </div>
            <div className="account-user-mobile">
              <div className="mobile-avatar">👤</div>
              <span>{users[0]?.firstName || "Account"}</span>
            </div>
          </div>

          {message && (
            <div className={`account-message ${message.includes("success") ? "success" : "error"}`}>
              {message}
            </div>
          )}

          <section className="account-section">
            <div className="section-header">
              <div>
                <p className="section-kicker">PERSONAL DETAILS</p>
                <h2>Basic Information</h2>
              </div>
              {!editMode && (
                <button type="button" className="text-edit" onClick={handleEditClick}>Edit</button>
              )}
            </div>

            {!editMode ? (
              <div className="profile-grid">
                <div className="profile-field">
                  <label>First Name</label>
                  <p>{users[0]?.firstName || "—"}</p>
                </div>
                <div className="profile-field">
                  <label>Last Name</label>
                  <p>{users[0]?.lastName || "—"}</p>
                </div>
                <div className="profile-field">
                  <label>Email Address</label>
                  <p>{users[0]?.email || "—"}</p>
                </div>
                <div className="profile-field">
                  <label>Gender</label>
                  <p>{users[0]?.gender || "—"}</p>
                </div>
                <div className="profile-field">
                  <label>Date of Birth</label>
                  <p>{users[0]?.dob ? new Date(users[0].dob).toLocaleDateString("en-GB") : "—"}</p>
                </div>
              </div>
            ) : (
              <form className="profile-grid edit-grid" onSubmit={handleFormSubmit}>
                <div className="profile-field">
                  <label htmlFor="firstName">First Name</label>
                  <input id="firstName" type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
                </div>
                <div className="profile-field">
                  <label htmlFor="lastName">Last Name</label>
                  <input id="lastName" type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
                </div>
                <div className="profile-field">
                  <label htmlFor="email">Email Address</label>
                  <input id="email" type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                </div>
                <div className="profile-field">
                  <label htmlFor="gender">Gender</label>
                  <select id="gender" name="gender" value={formData.gender} onChange={handleInputChange} required>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="profile-field">
                  <label htmlFor="dob">Date of Birth</label>
                  <input id="dob" type="date" name="dob" value={formData.dob} onChange={handleInputChange} required />
                </div>
                <div className="profile-actions">
                  <button type="button" className="secondary-btn" onClick={() => setEditMode(false)} disabled={loading}>Cancel</button>
                  <button type="submit" className="primary-btn" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</button>
                </div>
              </form>
            )}
          </section>

          <section className="account-section">
            <div className="section-header">
              <div>
                <p className="section-kicker">SECURITY & CONTACT</p>
                <h2>Contact Information</h2>
              </div>
            </div>

            <div className="profile-grid">
              <div className="profile-field">
                <label>Mobile Number</label>
                {!editMode ? (
                  <p>{users[0]?.phone ? `+91 ${users[0].phone}` : "—"}</p>
                ) : (
                  <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} required />
                )}
              </div>
              <div className="profile-field password-field">
                <label>Password</label>
                <p>••••••••</p>
                <button type="button" className="text-edit password-change" onClick={() => setShowPasswordForm(true)}>Change Password</button>
              </div>
            </div>

            {showPasswordForm && (
              <form className="password-form" onSubmit={handlePasswordSubmit}>
                <div className="password-form-title">
                  <h3>Change Password</h3>
                  <p>Choose a strong password that you don't use elsewhere.</p>
                </div>
                <div className="password-grid">
                  <div className="profile-field">
                    <label htmlFor="newPassword">New Password</label>
                    <input id="newPassword" type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordInputChange} required />
                  </div>
                  <div className="profile-field">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input id="confirmPassword" type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordInputChange} required />
                  </div>
                </div>
                <div className="profile-actions">
                  <button type="button" className="secondary-btn" onClick={() => { setShowPasswordForm(false); setPasswordMessage(""); setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" }); }} disabled={passwordLoading}>Cancel</button>
                  <button type="submit" className="primary-btn" disabled={passwordLoading}>{passwordLoading ? "Updating..." : "Update Password"}</button>
                </div>
                {passwordMessage && (
                  <div className={`account-message ${passwordMessage.includes("success") ? "success" : "error"}`}>{passwordMessage}</div>
                )}
              </form>
            )}
          </section>

          <div className="account-note">
            <span className="note-icon">✓</span>
            <div>
              <strong>Your information is secure</strong>
              <p>Keep your contact details up to date so we can provide a better shopping experience.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

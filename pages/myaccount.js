"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {jwtDecode} from "jwt-decode";
import api from "../lib/axiosInstance";
export default function MyAccountPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [users, setUsers] = useState([]);
  useEffect(() => {
      const token = localStorage.getItem("token");
    console.log('token',token);

  const decoded = jwtDecode(token);
  const userId = decoded.id;
      api.get(`/users?_id=${userId}`)
       .then((res) => setUsers(res.data))
  },[])
    console.log('users',users);
    
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
        <h2>MY PROFILE</h2>

        {/* BASIC INFO */}
        <section className="info-section">
          <div className="section-header">
            <h3>BASIC INFORMATION</h3>
            <span className="edit">Edit</span>
          </div>

          <div className="info-grid">
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
              <p>{new Date(users[0]?.dob).toLocaleDateString("en-GB")}</p>
            </div>
          </div>
        </section>

        {/* CONTACT INFO */}
        <section className="info-section">
          <div className="section-header">
            <h3>CONTACT INFORMATION</h3>
          </div>

          <div className="info-grid">
            <div>
              <label>Mobile Number</label>
              <p>+91 {users[0]?.phone}</p>
            </div>
            <div>
              <label>Password</label>
              <p>********</p>
              <span className="edit">Change</span>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

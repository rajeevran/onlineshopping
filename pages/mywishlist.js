"use client";
import { usePathname, useRouter } from "next/navigation";

export default function MyWishlistPage() {
  const router = useRouter();
  const pathname = usePathname();
console.log("pathname", pathname);
  return (
    <div className="account-container">
      {/* LEFT SIDEBAR */}
      <aside className="account-sidebar">
        <div className="profile-card">
          <div className="avatar">👤</div>
          <h4>Rrr Tttt</h4>
          <p className="email">rajnanjan505@gmail.com</p>

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
          <li 
              className={pathname === "/mywishlist" ? "active" : ""}
              onClick={() => router.push("mywishlist")}>My Wishlist</li>
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
        <h2>MY wish list</h2>

        {/* BASIC INFO */}
        <section className="info-section">
          <div className="section-header">
            <h3>BASIC INFORMATION</h3>
            <span className="edit">Edit</span>
          </div>

          <div className="info-grid">
            <div>
              <label>wish</label>
              <p>rrr</p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

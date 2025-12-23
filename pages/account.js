"use client";
export default function MyAccountPage() {
  return (
    <div className="account-container">
      {/* LEFT SIDEBAR */}
      <aside className="account-sidebar">
        <div className="profile-card">
          <div className="avatar">👤</div>
          <h4>Rrr Tttt</h4>
          <p className="email">rajnanjan505@gmail.com</p>

          <div className="progress">
            <div className="progress-bar" style={{ width: "66%" }}></div>
          </div>
          <span className="progress-text">66.67% Completed</span>

          <a href="#" className="complete-profile">
            Complete profile for better suggestions
          </a>
        </div>

        <ul className="menu">
          <li className="active">My Profile</li>
          <li>My Orders</li>
          <li>My Wishlist</li>
          <li>My Addresses</li>
          <li>My Bank Account</li>
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
              <p>rrr</p>
            </div>
            <div>
              <label>Last Name</label>
              <p>tttt</p>
            </div>
            <div>
              <label>Email</label>
              <p><strong>rajnanjan505@gmail.com</strong></p>
            </div>
            <div>
              <label>Gender</label>
              <p>-</p>
            </div>
            <div>
              <label>Date of Birth</label>
              <p>-</p>
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
              <p>+91 7003544591</p>
            </div>
            <div>
              <label>Password</label>
              <p>********</p>
              <span className="edit">Change</span>
            </div>
          </div>
        </section>

        {/* NEWSLETTER */}
        <section className="newsletter">
          <input type="checkbox" />
          <p>
            Become a part of the family! Sign up to stay updated on new
            product launches and much more.
          </p>
        </section>
      </main>
    </div>
  );
}

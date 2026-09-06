import { useState } from "react";
import { useRouter } from "next/router";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Admin login failed");
        return;
      }
      localStorage.setItem("adminToken", data.token);
      router.replace("/admin");
    } catch (err) {
      setError("Unable to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-brand">NOADUA</div>
        <span className="admin-login-badge">ADMIN PORTAL</span>
        <h1>Welcome back</h1>
        <p>Sign in to manage your store, customers and orders.</p>
        {error && <div className="admin-alert error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" required />
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          <button className="admin-primary-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign in to Admin"}
          </button>
        </form>
        <button className="admin-back-link" onClick={() => router.push("/")}>← Back to store</button>
      </div>
    </div>
  );
}

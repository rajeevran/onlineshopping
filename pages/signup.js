"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function Signup() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    passwordHash: "",
    confirmPassword: "",
    phone:"",
    gender:"",
    dob:"",
    role:"admin"
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.passwordHash ||
      !formData.confirmPassword
    ) {
      alert("All fields are required.");
      return;
    }

    if (formData.passwordHash !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            firstName: formData.firstName, 
            lastName: formData.lastName, 
            email: formData.email, 
            passwordHash: formData.passwordHash,
            phone: formData.phone,
            gender: formData.gender,
            dob: formData.dob,
            role: formData.role
         })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      alert("Account created successfully.");
      // 2. Automatically login

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: formData.email, passwordHash: formData.passwordHash })
    });

    const loggedindata = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(loggedindata.message);
      return;
    }

    localStorage.setItem("token", loggedindata.token);
    window.location.href = "/";

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone:"",
        gender:"",
        dob:"",
        role:"admin"
      });

    } catch (err) {
      console.log(err);
      alert("Server Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <form onSubmit={handleSignup} className="signup-form">

        <h2>Create Account</h2>

        <input
          type="text"
          placeholder="First Name"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
        />

        <input
          type="text"
          placeholder="Last Name"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
        />

        <input
          type="email"
          placeholder="Email Address"
          name="email"
          value={formData.email}
          onChange={handleChange}
        />

        
        <input
          type="phone"
          placeholder="Phone Number"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
        />

        
        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          required
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </select>
        
        <input
          type="date"
          name="dob"
          value={formData.dob}
          onChange={handleChange}
          required
          max={new Date().toISOString().split("T")[0]} // Prevent future dates
        />

        <input
          type="password"
          placeholder="Password"
          name="passwordHash"
          value={formData.passwordHash}
          onChange={handleChange}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
        />
        <button className="primary-btn" disabled={loading}>
          {loading ? "Creating..." : "Sign Up"}
        </button>

      </form>
    </div>
  );
}
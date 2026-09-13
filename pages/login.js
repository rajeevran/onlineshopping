"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FiArrowLeft, FiCheck, FiLock, FiPhone } from "react-icons/fi";

export default function Signup() {
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);

  const normalizedPhone = phone.replace(/\D/g, "").replace(/^91/, "").slice(0, 10);

  useEffect(() => {
    if (step === "otp") inputs.current[0]?.focus();
  }, [step]);

  const sendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      setError("Enter a valid 10-digit phone number.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", phone: normalizedPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not send OTP.");
      setMessage("OTP sent. Enter the 4-digit code to continue.");
      setStep("otp");
    } catch (err) {
      setError(err.message || "Could not send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 3) inputs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!pasted) return;
    e.preventDefault();
    const next = ["", "", "", ""];
    pasted.split("").forEach((digit, i) => { next[i] = digit; });
    setOtp(next);
    inputs.current[Math.min(pasted.length, 4) - 1]?.focus();
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const code = otp.join("");

    if (code.length !== 4) {
      setError("Enter the 4-digit OTP.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", phone: normalizedPhone, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid OTP.");

      localStorage.setItem("token", data.token);
      setStep("success");
      setTimeout(() => { window.location.href = "/"; }, 650);
    } catch (err) {
      setError(err.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="phone-auth-page">
      <section className="phone-auth-card" aria-label="Phone login">
        <div className="phone-auth-brand">
          <span>NOADUA</span>
          <small>{(step === "phone" || step === "otp" || step === "success") ? 'USER' : 'ADMIN'}</small>
        </div>

        <div className="phone-auth-icon">
          {step === "success" ? <FiCheck /> : step === "otp" ? <FiLock /> : <FiPhone />}
        </div>

        {step === "phone" && (
          <>
            <div className="phone-auth-heading">
              <p className="phone-auth-eyebrow">WELCOME BACK</p>
              <h1>Sign in with your phone</h1>
              <p>Enter your phone number and we&apos;ll send you a one-time verification code.</p>
            </div>

            <form onSubmit={sendOtp} className="phone-auth-form">
              <label htmlFor="phone">Phone number</label>
              <div className="phone-input-wrap">
                <span>+91</span>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="98765 43210"
                  value={normalizedPhone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={10}
                  autoFocus
                />
              </div>
              {error && <p className="phone-auth-error">{error}</p>}
              <button type="submit" className="phone-auth-primary" disabled={loading}>
                {loading ? "Sending OTP…" : "Continue"}
              </button>
            </form>
          </>
        )}

        {step === "otp" && (
          <>
            <button className="phone-auth-back" type="button" onClick={() => { setStep("phone"); setError(""); }}>
              <FiArrowLeft /> Change number
            </button>
            <div className="phone-auth-heading">
              <p className="phone-auth-eyebrow">VERIFY PHONE</p>
              <h1>Enter your OTP</h1>
              <p>We sent a 4-digit code to <strong>+91 {normalizedPhone}</strong>.</p>
            </div>

            <form onSubmit={verifyOtp} className="phone-auth-form">
              <div className="otp-inputs" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    aria-label={`OTP digit ${index + 1}`}
                  />
                ))}
              </div>
              {message && <p className="phone-auth-message">{message}</p>}
              {error && <p className="phone-auth-error">{error}</p>}
              <button type="submit" className="phone-auth-primary" disabled={loading}>
                {loading ? "Verifying…" : "Verify & Login"}
              </button>
              <p className="phone-auth-dev-note">Development OTP: <strong>1234</strong></p>
            </form>
          </>
        )}

        {step === "success" && (
          <div className="phone-auth-success">
            <h1>You&apos;re signed in</h1>
            <p>Phone verified successfully. Taking you to your account…</p>
          </div>
        )}

        {step !== "success" && (
          <p className="phone-auth-footer">
            By continuing, you agree to our terms and privacy policy.
          </p>
        )}

        <Link href="/" className="phone-auth-home">← Back to Noadua</Link>
      </section>
    </main>
  );
}

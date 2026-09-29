import React, { useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  UserRound,
  Chrome,
  ShieldCheck,
  Sparkles,
  Play
} from "lucide-react";
import { supabase } from "../lib/supabase";

const SITE_URL = window.location.origin;

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const clearMessages = () => {
    setMsg("");
    setError("");
  };

  const changeMode = (next) => {
    clearMessages();
    setMode(next);
    setOtp("");
  };

  async function login(e) {
    e.preventDefault();
    clearMessages();
    setBusy(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    setBusy(false);

    if (error) setError(error.message);
  }

  async function signup(e) {
    e.preventDefault();
    clearMessages();

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: name.trim()
        },
        emailRedirectTo: `${SITE_URL}/auth`
      }
    });

    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.session) return;

    setMode("otp");
    setMsg("Account created. Enter the verification code sent to your email.");
  }

  async function sendOtp(e) {
    if (e) e.preventDefault();

    clearMessages();

    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }

    setBusy(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false
      }
    });

    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMode("otp");
    setMsg("A one-time verification code was sent to your email.");
  }

  async function verifyOtp(e) {
    e.preventDefault();
    clearMessages();

    if (!/^\d{6,8}$/.test(otp.trim())) {
      setError("Enter the verification code from your email.");
      return;
    }

    setBusy(true);

    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: "email"
    });

    setBusy(false);

    if (error) setError(error.message);
  }

  async function forgotPassword(e) {
    e.preventDefault();
    clearMessages();

    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }

    setBusy(true);

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${SITE_URL}/reset-password`
      }
    );

    setBusy(false);

    if (error) {
      setError(error.message);
    } else {
      setMsg("Password reset instructions have been sent to your email.");
    }
  }

  async function googleLogin() {
    clearMessages();
    setBusy(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${SITE_URL}/`
      }
    });

    if (error) {
      setBusy(false);
      setError(error.message);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb orb-one" />
        <div className="auth-orb orb-two" />
        <div className="auth-orb orb-three" />
        <div className="auth-grid" />
      </div>

      <div className="auth-shell">

        <div className="auth-showcase">
          <div className="showcase-brand">
            <div className="brand-mark">
              <Play size={22} fill="currentColor" />
            </div>
            <span>KadoTV</span>
          </div>

          <div className="showcase-content">
            <div className="live-pill">
              <span />
              PREMIUM STREAMING
            </div>

            <h2>
              Your entertainment.
              <strong> Your way.</strong>
            </h2>

            <p>
              Movies, series and sports — all in one modern streaming
              experience.
            </p>

            <div className="showcase-features">
              <span><Sparkles size={14} /> HD Streaming</span>
              <span><Play size={14} /> Movies & Series</span>
              <span><ShieldCheck size={14} /> Secure Account</span>
            </div>
          </div>

          <div className="showcase-footer">
            <span>© KadoTV</span>
            <span>Stream smarter.</span>
          </div>
        </div>

        <div className="auth-panel">

          <div className="mobile-brand">
            <div className="brand-mark">
              <Play size={20} fill="currentColor" />
            </div>
            <b>KadoTV</b>
          </div>

          {mode === "otp" && (
            <button
              type="button"
              className="auth-back"
              onClick={() => changeMode("login")}
            >
              <ArrowLeft size={16} />
              Back to login
            </button>
          )}

          <div className="auth-heading">
            <div className="heading-icon">
              {mode === "login" && <LockKeyhole size={20} />}
              {mode === "signup" && <UserRound size={20} />}
              {mode === "forgot" && <KeyRound size={20} />}
              {mode === "otp" && <ShieldCheck size={20} />}
            </div>

            <h1>
              {mode === "login" && "Welcome back"}
              {mode === "signup" && "Create your account"}
              {mode === "forgot" && "Reset your password"}
              {mode === "otp" && "Verify your email"}
            </h1>

            <p>
              {mode === "login" &&
                "Sign in and continue watching on KadoTV."}

              {mode === "signup" &&
                "Join KadoTV and start your streaming journey."}

              {mode === "forgot" &&
                "We'll send instructions to reset your password."}

              {mode === "otp" &&
                `Enter the code sent to ${email}`}
            </p>
          </div>

          {mode === "login" && (
            <>
              <form className="auth-form" onSubmit={login}>

                <AuthInput
                  icon={<Mail size={18} />}
                  label="Email address"
                  type="email"
                  value={email}
                  setValue={setEmail}
                  placeholder="you@example.com"
                />

                <AuthInput
                  icon={<LockKeyhole size={18} />}
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  setValue={setPassword}
                  placeholder="Enter your password"
                  right={
                    <button
                      type="button"
                      className="input-action"
                      onClick={() => setShowPassword(v => !v)}
                    >
                      {showPassword
                        ? <EyeOff size={18} />
                        : <Eye size={18} />}
                    </button>
                  }
                />

                <div className="forgot-row">
                  <span />
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => changeMode("forgot")}
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  className="auth-primary"
                  disabled={busy}
                >
                  {busy ? (
                    <>
                      <span className="spinner" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowLeft className="arrow-right" size={18} />
                    </>
                  )}
                </button>
              </form>

              <Divider />

              <button
                type="button"
                className="auth-google"
                onClick={googleLogin}
                disabled={busy}
              >
                <span className="google-icon">G</span>
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                className="auth-otp"
                onClick={sendOtp}
                disabled={busy || !email.trim()}
              >
                <KeyRound size={17} />
                Sign in with Email OTP
              </button>

              <div className="auth-switch">
                <span>Don't have an account?</span>
                <button
                  type="button"
                  onClick={() => changeMode("signup")}
                >
                  Create one
                </button>
              </div>
            </>
          )}

          {mode === "signup" && (
            <>
              <form className="auth-form" onSubmit={signup}>

                <AuthInput
                  icon={<UserRound size={18} />}
                  label="Full name"
                  type="text"
                  value={name}
                  setValue={setName}
                  placeholder="Your name"
                />

                <AuthInput
                  icon={<Mail size={18} />}
                  label="Email address"
                  type="email"
                  value={email}
                  setValue={setEmail}
                  placeholder="you@example.com"
                />

                <AuthInput
                  icon={<LockKeyhole size={18} />}
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  setValue={setPassword}
                  placeholder="Create a password"
                  right={
                    <button
                      type="button"
                      className="input-action"
                      onClick={() => setShowPassword(v => !v)}
                    >
                      {showPassword
                        ? <EyeOff size={18} />
                        : <Eye size={18} />}
                    </button>
                  }
                />

                <AuthInput
                  icon={<ShieldCheck size={18} />}
                  label="Confirm password"
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  setValue={setConfirm}
                  placeholder="Repeat your password"
                />

                <button
                  type="submit"
                  className="auth-primary"
                  disabled={busy}
                >
                  {busy ? (
                    <>
                      <span className="spinner" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowLeft className="arrow-right" size={18} />
                    </>
                  )}
                </button>
              </form>

              <Divider />

              <button
                type="button"
                className="auth-google"
                onClick={googleLogin}
                disabled={busy}
              >
                <span className="google-icon">G</span>
                <span>Continue with Google</span>
              </button>

              <div className="auth-switch">
                <span>Already have an account?</span>
                <button
                  type="button"
                  onClick={() => changeMode("login")}
                >
                  Sign in
                </button>
              </div>
            </>
          )}

          {mode === "otp" && (
            <form className="auth-form" onSubmit={verifyOtp}>
              <div className="otp-box">
                <KeyRound size={22} />
                <span>Verification code</span>
              </div>

              <input
                className="otp-input"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                required
                value={otp}
                onChange={e =>
                  setOtp(e.target.value.replace(/\D/g, ""))
                }
                placeholder="000000"
              />

              <button
                type="submit"
                className="auth-primary"
                disabled={busy}
              >
                {busy ? (
                  <>
                    <span className="spinner" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify & continue
                    <ArrowLeft className="arrow-right" size={18} />
                  </>
                )}
              </button>

              <button
                type="button"
                className="auth-otp"
                onClick={sendOtp}
                disabled={busy}
              >
                <KeyRound size={17} />
                Resend verification code
              </button>
            </form>
          )}

          {mode === "forgot" && (
            <>
              <form className="auth-form" onSubmit={forgotPassword}>
                <AuthInput
                  icon={<Mail size={18} />}
                  label="Email address"
                  type="email"
                  value={email}
                  setValue={setEmail}
                  placeholder="you@example.com"
                />

                <button
                  type="submit"
                  className="auth-primary"
                  disabled={busy}
                >
                  {busy ? (
                    <>
                      <span className="spinner" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send reset email
                      <ArrowLeft className="arrow-right" size={18} />
                    </>
                  )}
                </button>
              </form>

              <button
                type="button"
                className="auth-back center-back"
                onClick={() => changeMode("login")}
              >
                <ArrowLeft size={16} />
                Back to login
              </button>
            </>
          )}

          {(msg || error) && (
            <div className={`auth-message ${error ? "is-error" : "is-success"}`}>
              <span />
              {error || msg}
            </div>
          )}

          <div className="auth-security">
            <ShieldCheck size={15} />
            <span>Secure authentication powered by Supabase</span>
          </div>

        </div>
      </div>
    </div>
  );
}

function AuthInput({
  icon,
  label,
  type,
  value,
  setValue,
  placeholder,
  right
}) {
  return (
    <div className="auth-field">
      <label>{label}</label>

      <div className="auth-input-wrap">
        <span className="field-icon">{icon}</span>

        <input
          type={type}
          required
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={placeholder}
        />

        {right}
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div className="auth-divider">
      <span />
      <b>OR</b>
      <span />
    </div>
  );
}

export function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function updatePassword(e) {
    e.preventDefault();
    setMsg("");
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);

    const { error } = await supabase.auth.updateUser({
      password
    });

    setBusy(false);

    if (error) {
      setError(error.message);
    } else {
      setMsg("Password updated successfully.");

      setTimeout(() => {
        window.location.assign("/auth");
      }, 1200);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb orb-one" />
        <div className="auth-orb orb-two" />
        <div className="auth-orb orb-three" />
        <div className="auth-grid" />
      </div>

      <div className="auth-panel reset-panel">
        <div className="mobile-brand">
          <div className="brand-mark">
            <Play size={20} fill="currentColor" />
          </div>
          <b>KadoTV</b>
        </div>

        <div className="auth-heading">
          <div className="heading-icon">
            <KeyRound size={20} />
          </div>
          <h1>Choose a new password</h1>
          <p>Create a new secure password for your KadoTV account.</p>
        </div>

        <form className="auth-form" onSubmit={updatePassword}>
          <AuthInput
            icon={<LockKeyhole size={18} />}
            label="New password"
            type="password"
            value={password}
            setValue={setPassword}
            placeholder="New password"
          />

          <AuthInput
            icon={<ShieldCheck size={18} />}
            label="Confirm password"
            type="password"
            value={confirm}
            setValue={setConfirm}
            placeholder="Repeat password"
          />

          <button
            type="submit"
            className="auth-primary"
            disabled={busy}
          >
            {busy ? "Updating..." : "Update password"}
          </button>
        </form>

        {(msg || error) && (
          <div className={`auth-message ${error ? "is-error" : "is-success"}`}>
            <span />
            {error || msg}
          </div>
        )}

        <div className="auth-security">
          <ShieldCheck size={15} />
          <span>KadoTV account security</span>
        </div>
      </div>
    </div>
  );
}

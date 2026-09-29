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
  ShieldCheck
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

  function clearMessages() {
    setMsg("");
    setError("");
  }

  function changeMode(next) {
    clearMessages();
    setMode(next);
    setOtp("");
  }

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
        emailRedirectTo: SITE_URL + "/auth"
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
        redirectTo: SITE_URL + "/reset-password"
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
        redirectTo: SITE_URL + "/"
      }
    });

    if (error) {
      setBusy(false);
      setError(error.message);
    }
  }

  return (
    <div className="auth">
      <div className="auth-glow" />

      <div className="auth-card">

        <div className="auth-brand">
          <span>K</span>
          <b>KadoTV</b>
        </div>

        {mode === "otp" && (
          <button
            className="back"
            onClick={() => changeMode("login")}
          >
            <ArrowLeft size={16} />
            Back to login
          </button>
        )}

        <div className="auth-copy">
          <h1>
            {mode === "login" && "Welcome back."}
            {mode === "signup" && "Create your account."}
            {mode === "forgot" && "Reset your password."}
            {mode === "otp" && "Enter your code."}
          </h1>

          <p>
            {mode === "login" &&
              "Sign in to continue watching on KadoTV."}

            {mode === "signup" &&
              "Create your KadoTV account and start watching."}

            {mode === "forgot" &&
              "Enter your email and we'll send you password reset instructions."}

            {mode === "otp" &&
              "Enter the one-time code sent to " + email}
          </p>
        </div>

        {mode === "login" && (
          <>
            <form onSubmit={login}>
              <label>Email address</label>

              <div className="input-icon">
                <Mail />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <label>Password</label>

              <PasswordInput
                value={password}
                setValue={setPassword}
                show={showPassword}
                setShow={setShowPassword}
              />

              <div className="auth-row">
                <span />
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => changeMode("forgot")}
                >
                  Forgot password?
                </button>
              </div>

              <button
                className="primary-btn full"
                disabled={busy}
              >
                {busy ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <Divider />

            <button
              className="google-btn"
              onClick={googleLogin}
              disabled={busy}
            >
              <Chrome size={18} />
              Continue with Google
            </button>

            <button
              className="secondary-btn full"
              onClick={sendOtp}
              disabled={busy || !email.trim()}
            >
              <KeyRound size={17} />
              Sign in with Email OTP
            </button>

            <p className="switch-auth">
              Don't have an account?
              <button onClick={() => changeMode("signup")}>
                Create one
              </button>
            </p>
          </>
        )}

        {mode === "signup" && (
          <>
            <form onSubmit={signup}>
              <label>Full name</label>

              <div className="input-icon">
                <UserRound />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <label>Email address</label>

              <div className="input-icon">
                <Mail />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <label>Password</label>

              <PasswordInput
                value={password}
                setValue={setPassword}
                show={showPassword}
                setShow={setShowPassword}
              />

              <label>Confirm password</label>

              <div className="input-icon">
                <LockKeyhole />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                />
              </div>

              <button
                className="primary-btn full"
                disabled={busy}
              >
                {busy ? "Creating account…" : "Create account"}
              </button>
            </form>

            <Divider />

            <button
              className="google-btn"
              onClick={googleLogin}
              disabled={busy}
            >
              <Chrome size={18} />
              Continue with Google
            </button>

            <p className="switch-auth">
              Already have an account?
              <button onClick={() => changeMode("login")}>
                Sign in
              </button>
            </p>
          </>
        )}

        {mode === "otp" && (
          <form onSubmit={verifyOtp}>
            <label>Verification code</label>

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
              className="primary-btn full"
              disabled={busy}
            >
              {busy ? "Verifying…" : "Verify & continue"}
            </button>

            <button
              type="button"
              className="secondary-btn full"
              onClick={sendOtp}
              disabled={busy}
            >
              Resend OTP
            </button>
          </form>
        )}

        {mode === "forgot" && (
          <>
            <form onSubmit={forgotPassword}>
              <label>Email address</label>

              <div className="input-icon">
                <Mail />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <button
                className="primary-btn full"
                disabled={busy}
              >
                {busy ? "Sending…" : "Send reset email"}
              </button>
            </form>

            <button
              className="back auth-back-bottom"
              onClick={() => changeMode("login")}
            >
              <ArrowLeft size={16} />
              Back to login
            </button>
          </>
        )}

        {(msg || error) && (
          <div className={error ? "auth-msg error" : "auth-msg"}>
            {error || msg}
          </div>
        )}

        <div className="secure">
          <ShieldCheck size={15} />
          Secure authentication powered by Supabase
        </div>

      </div>
    </div>
  );
}

function PasswordInput({
  value,
  setValue,
  show,
  setShow
}) {
  return (
    <div className="input-icon">
      <LockKeyhole />

      <input
        type={show ? "text" : "password"}
        required
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="••••••••"
      />

      <button
        type="button"
        className="password-toggle"
        onClick={() => setShow(v => !v)}
      >
        {show ? (
          <EyeOff size={17} />
        ) : (
          <Eye size={17} />
        )}
      </button>
    </div>
  );
}

function Divider() {
  return (
    <div className="auth-divider">
      <span>OR</span>
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
      setMsg("Password updated successfully. Redirecting to login...");

      setTimeout(() => {
        window.location.assign("/auth");
      }, 1200);
    }
  }

  return (
    <div className="auth">
      <div className="auth-glow" />

      <div className="auth-card">

        <div className="auth-brand">
          <span>K</span>
          <b>KadoTV</b>
        </div>

        <div className="auth-copy">
          <h1>Choose a new password.</h1>
          <p>
            Create a new password for your KadoTV account.
          </p>
        </div>

        <form onSubmit={updatePassword}>

          <label>New password</label>

          <input
            className="plain-auth-input"
            type="password"
            minLength={6}
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          <label>Confirm password</label>

          <input
            className="plain-auth-input"
            type="password"
            minLength={6}
            required
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="••••••••"
          />

          <button
            className="primary-btn full"
            disabled={busy}
          >
            {busy ? "Updating…" : "Update password"}
          </button>

        </form>

        {(msg || error) && (
          <div className={error ? "auth-msg error" : "auth-msg"}>
            {error || msg}
          </div>
        )}

        <div className="secure">
          <ShieldCheck size={15} />
          KadoTV account security
        </div>

      </div>
    </div>
  );
}

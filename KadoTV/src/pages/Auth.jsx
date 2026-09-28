import React,{useEffect,useState} from "react";
import {Mail, ArrowLeft, ShieldCheck} from "lucide-react";
import {supabase} from "../lib/supabase";

export default function Auth(){
  const [email,setEmail]=useState(""),[otp,setOtp]=useState(""),[sent,setSent]=useState(false),[busy,setBusy]=useState(false),[msg,setMsg]=useState("");
  async function send(e){
    e.preventDefault();setBusy(true);setMsg("");
    const {error}=await supabase.auth.signInWithOtp({email:email.trim(),options:{shouldCreateUser:true}});
    setBusy(false);
    if(error)setMsg(error.message);else{setSent(true);setMsg("OTP sent. Check your email.");}
  }
  async function verify(e){
    e.preventDefault();setBusy(true);setMsg("");
    const {error}=await supabase.auth.verifyOtp({email:email.trim(),token:otp.trim(),type:"email"});
    setBusy(false);if(error)setMsg(error.message);
  }
  return <div className="auth"><div className="auth-glow"/><div className="auth-card">
    <div className="auth-brand"><span>K</span><b>KadoTV</b></div>
    {!sent?<><div className="auth-copy"><h1>Welcome back.</h1><p>Sign in with your email. We'll send a secure one-time code.</p></div>
      <form onSubmit={send}><label>Email address</label><div className="input-icon"><Mail/><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div><button className="primary-btn full" disabled={busy}>{busy?"Sending…":"Send OTP"}</button></form>
    </>:<><button className="back" onClick={()=>setSent(false)}><ArrowLeft size={16}/> Change email</button><div className="auth-copy"><h1>Enter your code.</h1><p>We sent a one-time verification code to <b>{email}</b>.</p></div>
      <form onSubmit={verify}><label>OTP code</label><input className="otp-input" inputMode="numeric" maxLength="8" required value={otp} onChange={e=>setOtp(e.target.value)}/><button className="primary-btn full" disabled={busy}>{busy?"Verifying…":"Verify & continue"}</button></form></>}
    {msg&&<div className="auth-msg">{msg}</div>}<div className="secure"><ShieldCheck size={15}/> Secure authentication powered by Supabase</div>
  </div></div>;
}

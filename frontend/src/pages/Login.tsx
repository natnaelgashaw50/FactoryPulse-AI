import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@ishfp.local");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("Invalid email or password.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-panel border border-border rounded p-8">
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="text-cyan" size={22} />
          <div>
            <div className="font-bold">FactoryPulse AI</div>
            <div className="text-[11px] text-muted">Industrial Intelligence Platform</div>
          </div>
        </div>
        <label className="text-xs text-muted">Email</label>
        <input
          className="w-full mb-3 mt-1 bg-panelAlt border border-border rounded px-3 py-2 text-sm"
          value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
        />
        <label className="text-xs text-muted">Password</label>
        <input
          className="w-full mb-4 mt-1 bg-panelAlt border border-border rounded px-3 py-2 text-sm"
          value={password} onChange={(e) => setPassword(e.target.value)} type="password" required
        />
        {error && <div className="text-danger text-xs mb-3">{error}</div>}
        <button className="w-full bg-cyan text-bg font-semibold rounded py-2 text-sm" type="submit">
          Sign in
        </button>
        <div className="text-[10px] text-muted mt-4">
  Demo Accounts<br />
  Admin: admin@ishfp.local / admin123<br />
  Engineer: engineer@ishfp.local / engineer123<br />
  Manager: manager@ishfp.local / manager123
</div>
      </form>
    </div>
  );
}

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, User, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "../hooks/useAuth";

export default function AuthPage({ mode = "login" }) {
  const isLogin = mode === "login";
  const { login, signup } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const from = loc.state?.from?.pathname || "/chat";
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (isLogin) {
        await login({ email: form.email, password: form.password });
        toast.success("Welcome back!");
      } else {
        await signup(form);
        toast.success("Account created — welcome to Athena.ai");
      }
      nav(from, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || "Auth failed";
      toast.error(typeof msg === "string" ? msg : "Auth failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-void text-primary relative overflow-hidden flex items-center justify-center px-6">
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, #6366F112 0%, transparent 70%)", filter: "blur(40px)" }}
      />

      <Link to="/" className="absolute top-6 left-6 z-10 flex items-center gap-2 hover:opacity-80 transition-opacity">
        <span className="font-display font-bold text-base tracking-tight">Athena<span className="text-tertiary">.ai</span></span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-surface border border-border rounded-2xl p-8 sm:p-10">
          <h1 className="font-display font-bold text-3xl text-primary tracking-tight">
            {isLogin ? "Welcome back" : "Create account"}
          </h1>
          <p className="mt-2 text-sm text-secondary leading-relaxed">
            {isLogin
              ? "Sign in to access your documents and conversations."
              : "Start building your private multi-domain knowledge base."}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-3" data-testid={`${mode}-form`}>
            {!isLogin && (
              <Field
                icon={<User className="w-4 h-4" />}
                placeholder="Your name"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                testid="signup-name"
                required
              />
            )}
            <Field
              icon={<Mail className="w-4 h-4" />}
              type="email"
              placeholder="you@email.com"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              testid={`${mode}-email`}
              required
              autoComplete="email"
            />
            <Field
              icon={<Lock className="w-4 h-4" />}
              type="password"
              placeholder={isLogin ? "Password" : "Password (min 6 chars)"}
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
              testid={`${mode}-password`}
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={6}
            />

            <button
              type="submit"
              disabled={busy}
              data-testid={`${mode}-submit-btn`}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-finance hover:bg-[#5254CC] text-white font-medium text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-glow-finance"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {isLogin ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="text-sm text-secondary mt-6 text-center">
            {isLogin ? (
              <>
                New to Athena?{" "}
                <Link to="/signup" className="text-primary font-medium hover:underline" data-testid="auth-switch-link">
                  Create an account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline" data-testid="auth-switch-link">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ icon, value, onChange, type = "text", placeholder, testid, ...rest }) {
  return (
    <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-void border border-border focus-within:border-muted transition-colors">
      <span className="text-tertiary">{icon}</span>
      <input
        data-testid={testid}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-sm text-primary placeholder:text-tertiary"
        {...rest}
      />
    </label>
  );
}

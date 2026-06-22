import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Loader2, Mail, Lock, User, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { cn } from "../lib/cn";

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
    <div className="min-h-screen athena-bg grain relative overflow-hidden flex items-center justify-center p-6">
      <div className="absolute top-6 left-6 flex items-center gap-2.5 z-10">
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <span className="text-2xl">🦉</span>
          <span className="font-heading text-lg font-semibold tracking-tight">Athena.ai</span>
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="glass-strong rounded-3xl p-8 sm:p-10 animate-slide-up">
          <h1 className="font-heading text-3xl sm:text-4xl font-light tracking-tighter text-white">
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            {isLogin
              ? "Sign in to access your documents and conversations."
              : "Start building your private, multi-domain knowledge base."}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4" data-testid={`${mode}-form`}>
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
              className={cn(
                "w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-[#0A0F1E] font-semibold transition-all hover:-translate-y-0.5",
                busy && "opacity-70 cursor-not-allowed hover:translate-y-0"
              )}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {isLogin ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="text-sm text-slate-400 mt-6 text-center">
            {isLogin ? (
              <>
                New to Athena?{" "}
                <Link to="/signup" className="text-white font-medium hover:underline" data-testid="auth-switch-link">
                  Create an account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link to="/login" className="text-white font-medium hover:underline" data-testid="auth-switch-link">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, value, onChange, type = "text", placeholder, testid, ...rest }) {
  return (
    <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 focus-within:border-white/30 transition-colors">
      <span className="text-slate-500">{icon}</span>
      <input
        data-testid={testid}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-slate-500"
        {...rest}
      />
    </label>
  );
}

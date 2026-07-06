import React, { useState } from "react";
import { motion } from "motion/react";
import { Lock, Mail, Shield, User, Info, Key, CheckCircle, RefreshCw } from "lucide-react";

interface UserProfile {
  uid: string;
  email: string;
  role: "admin" | "analyst" | "viewer";
  createdAt: string;
}

interface UserAuthProps {
  user: UserProfile | null;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
}

export default function UserAuth({ user, onLogin, onLogout }: UserAuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isReset, setIsReset] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "analyst" | "viewer">("viewer");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Quick Login test helper
  const handleQuickLogin = async (selectedRole: "admin" | "analyst" | "viewer") => {
    setLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    const testEmail = `${selectedRole}@metropolis.gov`;
    const testPass = `${selectedRole}123`;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail, password: testPass }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Authentication failed.");
      }

      const data = await res.json();
      onLogin(data.user);
      setAuthSuccess(`Quick login successful: Enrolled as ${selectedRole.toUpperCase()}`);
    } catch (err: any) {
      setAuthError(err.message || "Quick auth failure.");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      if (isReset) {
        // Password Reset Request
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Password reset failed.");
        }

        const data = await res.json();
        setAuthSuccess(data.message);
        setIsReset(false);
      } else if (isLogin) {
        // Login Request
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Invalid credentials.");
        }

        const data = await res.json();
        onLogin(data.user);
        setAuthSuccess("Successfully authorized into control hub.");
      } else {
        // Register Request
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, role }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Registration failed.");
        }

        const data = await res.json();
        onLogin(data.user);
        setAuthSuccess("User registration completed successfully.");
      }
    } catch (err: any) {
      setAuthError(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-mono text-slate-400">Authenticated Operational Node</div>
              <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                {user.email}
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold tracking-wider uppercase ${
                  user.role === "admin"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : user.role === "analyst"
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}>
                  {user.role}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-slate-950 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 rounded-xl text-xs font-mono transition-all cursor-pointer"
          >
            Revoke Access
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full mx-auto space-y-6">
      {/* Visual Identity Logo in Login */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 bg-gradient-to-br from-sky-400 to-blue-600 text-white rounded-2xl shadow-lg shadow-sky-950/40">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold font-sans text-slate-100 tracking-tight">
          Metropolis Prime Gatekeeper
        </h2>
        <p className="text-xs text-slate-500 font-mono">
          Authorize operational credentials to access urban digital twins
        </p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
        {/* Decorative Grid Backdrop */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

        <div className="relative z-10 space-y-5">
          {/* Main Error/Success Banners */}
          {authError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-[11px] font-mono flex items-start gap-2 animate-shake">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[11px] font-mono flex items-start gap-2">
              <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{authSuccess}</span>
            </div>
          )}

          {/* Form Switch tabs */}
          {!isReset && (
            <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-slate-800/60 font-mono text-[10px]">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setAuthError(null);
                }}
                className={`py-1.5 rounded-lg transition-all font-bold ${
                  isLogin ? "bg-slate-900 text-slate-100 shadow" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                SECURE SIGN IN
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setAuthError(null);
                }}
                className={`py-1.5 rounded-lg transition-all font-bold ${
                  !isLogin ? "bg-slate-900 text-slate-100 shadow" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                CREATE USER
              </button>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-1 px-1">
                  Security Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@metropolis.gov"
                    required
                    className="w-full bg-slate-950 border border-slate-800/80 rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500/40 transition-all"
                  />
                </div>
              </div>

              {!isReset && (
                <div>
                  <label className="block text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-1 px-1 flex justify-between">
                    <span>Access Key / Password</span>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => setIsReset(true)}
                        className="text-[9px] text-sky-400 hover:underline hover:text-sky-300 font-semibold"
                      >
                        Forgot Access Key?
                      </button>
                    )}
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full bg-slate-950 border border-slate-800/80 rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500/40 transition-all"
                    />
                  </div>
                </div>
              )}

              {!isReset && !isLogin && (
                <div>
                  <label className="block text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-1 px-1">
                    Enrolled Operational Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: "viewer", label: "Viewer", desc: "View flows" },
                      { val: "analyst", label: "Analyst", desc: "Full Charts" },
                      { val: "admin", label: "Admin", desc: "Control Panel" }
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setRole(item.val as any)}
                        className={`py-2 px-1 rounded-xl border text-center font-mono flex flex-col items-center justify-center cursor-pointer transition-all ${
                          role === item.val
                            ? "bg-sky-500/10 border-sky-500/40 text-sky-400"
                            : "bg-slate-950 border-slate-800/80 text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        <span className="text-[10px] font-bold">{item.label}</span>
                        <span className="text-[7.5px] opacity-60 leading-none mt-0.5">{item.desc}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-slate-600 font-mono mt-1.5 px-1 leading-normal">
                    Note: Users registered via the UI are saved in the local session store. Secure RBAC roles prevent privilege escalation.
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl text-xs font-mono font-bold tracking-wider shadow-lg hover:shadow-sky-500/10 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              {isReset ? "DISPATCH RESET INSTRUCTIONS" : isLogin ? "AUTHORIZE CRITICAL ENROLLMENT" : "INITIALIZE NEW USER PROFILE"}
            </button>

            {isReset && (
              <button
                type="button"
                onClick={() => setIsReset(false)}
                className="w-full text-center text-[10px] text-slate-500 hover:text-slate-300 font-mono transition-colors"
              >
                Back to Sign In
              </button>
            )}
          </form>

          {/* Quick Login Section for Sandbox Testing */}
          <div className="pt-4 border-t border-slate-950">
            <span className="block text-[9px] text-slate-600 font-mono uppercase tracking-widest text-center mb-3">
              Developer Quick-Login Nodes
            </span>
            <div className="grid grid-cols-3 gap-2 font-mono text-[9px]">
              <button
                onClick={() => handleQuickLogin("admin")}
                className="py-2 rounded-xl bg-slate-950/80 border border-rose-950 hover:border-rose-500/40 text-rose-400 hover:bg-rose-950/20 transition-all cursor-pointer flex flex-col items-center justify-center"
              >
                <span className="font-bold">ADMIN ROLE</span>
                <span className="text-[7.5px] text-slate-600">admin123</span>
              </button>
              <button
                onClick={() => handleQuickLogin("analyst")}
                className="py-2 rounded-xl bg-slate-950/80 border border-indigo-950 hover:border-indigo-500/40 text-indigo-400 hover:bg-indigo-950/20 transition-all cursor-pointer flex flex-col items-center justify-center"
              >
                <span className="font-bold">ANALYST ROLE</span>
                <span className="text-[7.5px] text-slate-600">analyst123</span>
              </button>
              <button
                onClick={() => handleQuickLogin("viewer")}
                className="py-2 rounded-xl bg-slate-950/80 border border-slate-900 hover:border-slate-500/40 text-slate-400 hover:bg-slate-900/30 transition-all cursor-pointer flex flex-col items-center justify-center"
              >
                <span className="font-bold">VIEWER ROLE</span>
                <span className="text-[7.5px] text-slate-600">viewer123</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

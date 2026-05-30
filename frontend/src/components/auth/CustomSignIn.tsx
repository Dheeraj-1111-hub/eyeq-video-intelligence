import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Video, AlertCircle } from "lucide-react";

export function CustomSignIn({ onToggleMode }: { onToggleMode: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError("");

    try {
      await login({ email, password });
      // On success, AuthContext updates → SignedIn renders → this unmounts
    } catch (err: any) {
      const message = err?.response?.data?.error || "Login failed. Please try again.";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-zinc-950/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl w-full p-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white">Sign in to EYEQ</h2>
          <p className="text-zinc-400 text-sm mt-2">Welcome back! Please sign in to continue</p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="investigator@eyeq.ai"
              className="flex h-11 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="flex h-11 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all shadow-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl text-sm font-bold transition-all bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] h-11 px-4 py-2 w-full mt-2 disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Continue"}
          </button>
        </form>
      </div>

      <div className="mt-6 text-center text-sm text-zinc-400">
        Don't have an account?{" "}
        <button
          onClick={onToggleMode}
          className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
        >
          Sign up
        </button>
      </div>
    </>
  );
}

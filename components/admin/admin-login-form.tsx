"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { fadeUp, staggerContainer, tapSoft } from "@/lib/motion";

export function AdminLoginForm() {
  const reduce = useReducedMotion();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo iniciar sesión");
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.form
      initial={reduce ? false : "hidden"}
      animate="show"
      variants={staggerContainer}
      onSubmit={onSubmit}
      className="mt-8 space-y-4"
    >
      <motion.label variants={fadeUp} className="block">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#f4ead7]/50">
          Email
        </span>
        <input
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-[#D4AF37]/25 bg-[#0c0b0a] px-3 py-3 text-sm text-[#f4ead7] outline-none focus:border-[#D4AF37]"
          placeholder="admin@luminasocial.com"
        />
      </motion.label>
      <motion.label variants={fadeUp} className="block">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#f4ead7]/50">
          Contraseña
        </span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-[#D4AF37]/25 bg-[#0c0b0a] px-3 py-3 text-sm text-[#f4ead7] outline-none focus:border-[#D4AF37]"
          placeholder="••••••••"
        />
      </motion.label>

      {error ? (
        <motion.p variants={fadeUp} className="text-sm text-red-300">
          {error}
        </motion.p>
      ) : null}

      <motion.button
        variants={fadeUp}
        type="submit"
        disabled={loading}
        whileTap={reduce || loading ? undefined : tapSoft}
        className="flex w-full min-h-12 items-center justify-center gap-2 bg-[#D4AF37] text-sm font-semibold text-[#1a140c] disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Entrar al centro de control
      </motion.button>
    </motion.form>
  );
}

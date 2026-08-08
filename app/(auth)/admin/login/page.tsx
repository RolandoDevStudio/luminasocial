import { Suspense } from "react";
import Link from "next/link";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#0B0C10] px-6 py-12 text-[#f4ead7]">
      <div className="w-full max-w-md border border-[#D4AF37]/25 bg-[#12100e] p-8">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#D4AF37]">
          Administración
        </p>
        <h1 className="font-display mt-3 text-3xl text-[#f8f0e3]">
          Centro de control
        </h1>
        <p className="mt-2 text-sm text-[#f4ead7]/55">
          Acceso maestro con credenciales de entorno (
          <code className="text-[#D4AF37]/80">ADMIN_EMAIL</code> /{" "}
          <code className="text-[#D4AF37]/80">ADMIN_PASSWORD</code>).
        </p>

        <Suspense fallback={<p className="mt-8 text-sm text-[#f4ead7]/40">Cargando…</p>}>
          <AdminLoginForm />
        </Suspense>

        <p className="mt-6 text-center text-xs text-[#f4ead7]/40">
          <Link href="/" className="text-[#D4AF37] hover:underline">
            Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  );
}

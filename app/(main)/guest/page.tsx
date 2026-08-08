import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { GuestApp } from "@/components/guest/guest-app";

function GuestFallback() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#080706] text-[#D4AF37]">
      <Loader2 className="h-8 w-8 animate-spin" />
    </main>
  );
}

export default function GuestPage() {
  return (
    <Suspense fallback={<GuestFallback />}>
      <GuestApp />
    </Suspense>
  );
}

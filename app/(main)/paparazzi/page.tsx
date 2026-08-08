import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { PaparazziApp } from "@/components/paparazzi/paparazzi-app";

function PaparazziFallback() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#080706] text-[#D4AF37]">
      <Loader2 className="h-8 w-8 animate-spin" />
    </main>
  );
}

export default function PaparazziPage() {
  return (
    <Suspense fallback={<PaparazziFallback />}>
      <PaparazziApp />
    </Suspense>
  );
}

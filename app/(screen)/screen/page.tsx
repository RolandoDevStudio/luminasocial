import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { GiantScreen } from "@/components/screen/giant-screen";

function ScreenFallback() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#0B0C10] text-[#D4AF37]">
      <Loader2 className="h-10 w-10 animate-spin" />
    </main>
  );
}

export default function ScreenPage() {
  return (
    <Suspense fallback={<ScreenFallback />}>
      <GiantScreen />
    </Suspense>
  );
}

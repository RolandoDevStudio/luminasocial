import { notFound, redirect } from "next/navigation";
import { MagazineApp } from "@/components/magazine/magazine-app";
import { resolveMagazineSlug } from "@/lib/magazine/resolve";

type MagazinePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function MagazinePage({ params }: MagazinePageProps) {
  const { slug } = await params;
  const result = await resolveMagazineSlug(slug);

  if (result.status === "not_found") {
    notFound();
  }

  if (result.status === "redirect") {
    redirect(`/magazine/${result.token}`);
  }

  if (result.status === "expired") {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-[#080706] px-6 text-center text-[#f4ead7]">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37]">
          Lumina Social
        </p>
        <h1 className="font-display mt-4 text-3xl text-[#f8f0e3]">
          Álbum expirado
        </h1>
        <p className="mt-3 max-w-md text-sm text-[#f4ead7]/55">
          El enlace de{" "}
          <strong className="text-[#f4ead7]">{result.event.name}</strong> ya no
          está disponible. Contacta al organizador si necesitas una copia.
        </p>
      </main>
    );
  }

  return <MagazineApp event={result.event} isAlbum={result.isAlbum} />;
}

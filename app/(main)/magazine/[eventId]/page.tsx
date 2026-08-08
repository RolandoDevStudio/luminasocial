import { MagazineApp } from "@/components/magazine/magazine-app";

type MagazinePageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function MagazinePage({ params }: MagazinePageProps) {
  const { eventId } = await params;
  return <MagazineApp eventId={eventId} />;
}

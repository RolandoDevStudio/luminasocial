import { getAdminSession } from "@/lib/admin/auth";
import { listDeletedEventsWithAlbum, listEvents } from "@/lib/admin/events";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const [events, deletedEvents] = await Promise.all([
    listEvents(),
    listDeletedEventsWithAlbum(),
  ]);

  return (
    <AdminDashboard
      email={session.email}
      events={events}
      deletedEvents={deletedEvents}
    />
  );
}

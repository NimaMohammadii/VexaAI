import { Header } from "@/components/Header";
import { AdminEditor } from "@/components/AdminEditor";
import { getOrCreateLayout } from "@/lib/layout-service";

export default async function AdminPage() {
  const layout = await getOrCreateLayout();

  return (
    <main>
      <Header
        title="Admin Studio Control"
        subtitle="Manage the studio layout and push live updates instantly."
      />
      <AdminEditor initialLayout={layout} />
    </main>
  );
}

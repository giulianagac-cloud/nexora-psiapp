import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import BottomNav from "@/components/shared/BottomNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex h-full flex-col bg-fondo">
      <main className="flex-1 overflow-y-auto pb-[72px]">{children}</main>
      <BottomNav />
    </div>
  );
}

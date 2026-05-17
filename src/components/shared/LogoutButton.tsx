"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Button from "./Button";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="danger" fullWidth onClick={handleLogout}>
      Cerrar sesión
    </Button>
  );
}

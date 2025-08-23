import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/dashboard/dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <DashboardNav user={user} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}

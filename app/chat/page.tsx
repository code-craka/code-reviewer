import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createOrGetProfile } from "@/lib/auth/profile-service";

export default async function ChatPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const profileResult = await createOrGetProfile(user);
  if (!profileResult.success || !profileResult.data) {
    redirect("/login");
  }

  const profile = profileResult.data;

  return (
    <DashboardLayout user={user} profile={profile}>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        <ChatInterface profile={profile} />
      </div>
    </DashboardLayout>
  );
}

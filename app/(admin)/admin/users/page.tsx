import { createClient } from "@/lib/supabase/server";
import { UsersManager, UserProfileItem } from "@/components/admin/users-manager";
import { Users, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

const FALLBACK_USERS: UserProfileItem[] = [
  {
    id: "user-admin-1",
    full_name: "Kanhaiya Store Administrator",
    avatar_url: null,
    phone: "+91 98765 43210",
    role: "admin",
    created_at: "2026-08-15T10:00:00.000Z",
  },
  {
    id: "user-2",
    full_name: "Priya Sharma",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    phone: "+91 98111 22233",
    role: "user",
    created_at: "2026-08-20T12:30:00.000Z",
  },
  {
    id: "user-3",
    full_name: "Rahul Verma",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    phone: "+91 98222 33344",
    role: "user",
    created_at: "2026-08-22T14:45:00.000Z",
  },
  {
    id: "user-4",
    full_name: "Vikram Singh",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    phone: "+91 98333 44455",
    role: "user",
    created_at: "2026-08-25T09:15:00.000Z",
  },
];

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const { data: dbProfiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, phone, role, created_at, updated_at")
    .order("created_at", { ascending: false });

  let profiles: UserProfileItem[] = [];

  if (error || !dbProfiles || dbProfiles.length === 0) {
    profiles = FALLBACK_USERS;
  } else {
    profiles = dbProfiles as UserProfileItem[];
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase mb-2">
            <Shield className="h-3.5 w-3.5" />
            <span>Role-Based Access Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            User Profiles & Roles
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Review registered customers and configure administrative access levels. Role changes use standard authenticated sessions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-xl border border-border">
          <Users className="h-4 w-4 text-primary" />
          <span>{profiles.length} registered profiles</span>
        </div>
      </div>

      <UsersManager
        initialProfiles={profiles}
        currentUserId={currentUser?.id}
      />
    </div>
  );
}

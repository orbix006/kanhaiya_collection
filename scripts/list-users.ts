import { getLocalUsers } from "../lib/auth/local-auth";
import { isSupabaseConfigured } from "../lib/supabase/server";
import { createServiceClient } from "../lib/supabase/service";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function listUsers() {
  console.log("\n📋 Registered Users Audit:\n");

  if (isSupabaseConfigured()) {
    console.log("Mode: Supabase Cloud Database");
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey || serviceRoleKey === "placeholder-service-role-key") {
      console.log("Run this in Supabase SQL editor to see all users and roles:\n");
      console.log("SELECT u.id, u.email, p.full_name, p.role, u.created_at FROM auth.users u LEFT JOIN public.profiles p ON u.id = p.id;\n");
      return;
    }

    try {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role, created_at");

      if (error) throw error;

      console.table(data);
    } catch (err: any) {
      console.error("Failed to query profiles:", err.message);
    }
    return;
  }

  console.log("Mode: Local Development Store (data/local_auth.json)\n");
  const users = getLocalUsers();

  if (users.length === 0) {
    console.log("No registered users yet. Sign up at http://localhost:3000/signup\n");
    return;
  }

  const tableData = users.map((u) => ({
    "User ID": u.id,
    "Full Name": u.full_name,
    Email: u.email,
    Role: u.role,
    "Created At": u.created_at,
  }));

  console.table(tableData);
  console.log();
}

listUsers().catch((err) => {
  console.error("Execution error:", err);
  process.exit(1);
});

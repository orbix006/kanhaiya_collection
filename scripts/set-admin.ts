import { findLocalUserByEmail, setLocalUserRole, getLocalUsers } from "../lib/auth/local-auth";
import { isSupabaseConfigured } from "../lib/supabase/server";
import { createServiceClient } from "../lib/supabase/service";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function setAdmin() {
  const targetEmail = process.argv[2]?.trim().toLowerCase();

  if (!targetEmail) {
    console.error("\n❌ Error: Please specify the email address of the account to promote to Administrator.");
    console.log("\nUsage:\n  npx tsx scripts/set-admin.ts <email-address>\n");
    console.log("Example:\n  npx tsx scripts/set-admin.ts owner@kanhaiyacollection.com\n");
    process.exit(1);
  }

  console.log(`\n👑 Authorizing Administrator privileges for: ${targetEmail}`);

  // 1. Supabase Mode
  if (isSupabaseConfigured()) {
    console.log("📡 Connected to Supabase Cloud Provider...");
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey || serviceRoleKey === "placeholder-service-role-key") {
      console.log("\n⚠️ SUPABASE_SERVICE_ROLE_KEY is not provisioned in .env.local.");
      console.log("To grant the admin role via the Supabase Dashboard SQL Editor, run this query:\n");
      console.log("--------------------------------------------------------------------------------");
      console.log(`UPDATE public.profiles`);
      console.log(`SET role = 'admin'`);
      console.log(`WHERE id = (SELECT id FROM auth.users WHERE email = '${targetEmail}');\n`);
      console.log(`SELECT id, full_name, role FROM public.profiles WHERE id = (SELECT id FROM auth.users WHERE email = '${targetEmail}');`);
      console.log("--------------------------------------------------------------------------------\n");
      return;
    }

    try {
      const supabase = createServiceClient();
      // Look up user in auth.users via service client
      const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        throw listError;
      }

      const matchedUser = usersData.users.find(
        (u) => u.email?.toLowerCase() === targetEmail
      );

      if (!matchedUser) {
        console.error(`\n❌ User '${targetEmail}' was not found in Supabase Auth.`);
        console.log("Please create an account at http://localhost:3000/signup first, then re-run this command.\n");
        process.exit(1);
      }

      // Update role in public.profiles table
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", matchedUser.id);

      if (updateError) {
        throw updateError;
      }

      console.log(`\n✅ SUCCESS: Administrator privileges granted to ${targetEmail} (ID: ${matchedUser.id})!`);
      console.log(`You can now log in at http://localhost:3000/login and access http://localhost:3000/admin\n`);
      return;
    } catch (err: any) {
      console.error(`\n❌ Failed to update role in Supabase:`, err.message);
      console.log("You can execute this SQL in the Supabase Dashboard SQL editor instead:\n");
      console.log(`UPDATE public.profiles SET role = 'admin' WHERE id = (SELECT id FROM auth.users WHERE email = '${targetEmail}');\n`);
      process.exit(1);
    }
  }

  // 2. Local Development Mode
  console.log("💻 Local Development Authentication Mode active...");
  const user = findLocalUserByEmail(targetEmail);

  if (!user) {
    console.error(`\n❌ User '${targetEmail}' does not exist in local auth store.`);
    console.log("Available registered local accounts:");
    const existingUsers = getLocalUsers();
    if (existingUsers.length === 0) {
      console.log("  (No accounts registered yet. Please sign up at http://localhost:3000/signup first.)");
    } else {
      existingUsers.forEach((u) => {
        console.log(`  - ${u.email} (${u.full_name}) [Current Role: ${u.role}]`);
      });
    }
    console.log("\nPlease sign up first at http://localhost:3000/signup, then run this command.\n");
    process.exit(1);
  }

  const updated = await setLocalUserRole(targetEmail, "admin");
  if (!updated) {
    console.error("\n❌ Failed to update user role.");
    process.exit(1);
  }

  console.log(`\n✅ SUCCESS: ${updated.full_name} (${updated.email}) is now an Administrator!`);
  console.log(`   User ID: ${updated.id}`);
  console.log(`   Role: ${updated.role}`);
  console.log(`\nNext Steps:`);
  console.log(`1. Visit http://localhost:3000/login`);
  console.log(`2. Sign in with ${updated.email} and your password`);
  console.log(`3. You will be automatically redirected to http://localhost:3000/admin\n`);
}

setAdmin().catch((err) => {
  console.error("Execution failed:", err);
  process.exit(1);
});

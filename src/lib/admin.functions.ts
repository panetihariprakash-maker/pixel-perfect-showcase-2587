import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { supabase: { rpc: (fn: "has_role", args: { _user_id: string; _role: string }) => PromiseLike<{ data: boolean | null }> }; userId: string };

async function assertSuperAdmin(context: Ctx) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "superadmin" });
  if (!data) throw new Error("Only the Super Admin can do this");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function findUserByEmail(admin: Awaited<ReturnType<typeof assertSuperAdmin>>, email: string) {
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email);
    if (hit || data.users.length < 200) return hit ?? null;
  }
  return null;
}

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  business_name: z.string().trim().min(1).max(120),
  contact_name: z.string().trim().min(1).max(120),
  contact_phone: z.string().trim().max(30).default(""),
  origin: z.string().url().max(200),
  can_add: z.boolean(), can_edit: z.boolean(), can_publish: z.boolean(), can_remove: z.boolean(),
});

/** Creates (or invites) an approved business-owner account. */
export const inviteOwner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => inviteSchema.parse(d))
  .handler(async ({ data, context }) => {
    const admin = await assertSuperAdmin(context as unknown as Ctx);
    let user = await findUserByEmail(admin, data.email);
    let invited = false;
    if (!user) {
      const redirectTo = `${new URL(data.origin).origin}/owner-login`;
      const res = await admin.auth.admin.inviteUserByEmail(data.email, { redirectTo, data: { full_name: data.contact_name } });
      if (res.error) throw new Error(res.error.message);
      user = res.data.user;
      invited = true;
    }
    const { email, origin: _o, ...rest } = data;
    const { error } = await admin.from("business_owners").upsert({ user_id: user.id, contact_email: email, status: "Approved", ...rest }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    await admin.from("admin_audit_log").insert({ actor_id: context.userId, action: invited ? "invite owner" : "authorize existing user", entity: "business_owners", entity_id: user.id, summary: data.business_name });
    return { invited };
  });

export const listPlatformUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await assertSuperAdmin(context as unknown as Ctx);
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 500 });
    if (error) throw new Error(error.message);
    const [{ data: roles }, { data: owners }, { data: profiles }] = await Promise.all([
      admin.from("user_roles").select("user_id, role"),
      admin.from("business_owners").select("user_id, status, business_name"),
      admin.from("profiles").select("id, full_name, mobile"),
    ]);
    return data.users.map((u) => ({
      id: u.id, email: u.email ?? "", created_at: u.created_at, last_sign_in_at: u.last_sign_in_at ?? null,
      name: profiles?.find((p) => p.id === u.id)?.full_name ?? "",
      mobile: profiles?.find((p) => p.id === u.id)?.mobile ?? "",
      roles: (roles ?? []).filter((r) => r.user_id === u.id).map((r) => r.role),
      owner: owners?.find((o) => o.user_id === u.id) ?? null,
    }));
  });

const roleSchema = z.object({ userId: z.string().uuid(), role: z.enum(["frontdesk", "operations", "superadmin"]), grant: z.boolean() });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => roleSchema.parse(d))
  .handler(async ({ data, context }) => {
    const admin = await assertSuperAdmin(context as unknown as Ctx);
    if (!data.grant && data.role === "superadmin" && data.userId === context.userId) throw new Error("You can't remove your own Super Admin access");
    const res = data.grant
      ? await admin.from("user_roles").upsert({ user_id: data.userId, role: data.role }, { onConflict: "user_id,role" })
      : await admin.from("user_roles").delete().eq("user_id", data.userId).eq("role", data.role);
    if (res.error) throw new Error(res.error.message);
    await admin.from("admin_audit_log").insert({ actor_id: context.userId, action: data.grant ? `grant ${data.role}` : `revoke ${data.role}`, entity: "user_roles", entity_id: data.userId });
    return { ok: true };
  });

import { createClient } from "@/lib/supabase/server";
export default async function TeamPage() {
  const supabase = await createClient();
  const { data: profile } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", profile.user?.id ?? "").maybeSingle();
  if (!me || !["admin", "manager"].includes(me.role)) return <div className="notice error">Team management is restricted to Admin and Manager accounts.</div>;
  const { data, error } = await supabase.from("profiles").select("id,full_name,role,is_active,created_at").order("created_at");
  if (error) return <div className="notice error">Could not load team profiles.</div>;
  return <><div className="page-head"><div><div className="eyebrow">CHAI &amp; CO. / PEOPLE</div><h2>Team &amp; access</h2><p>User role management is not enabled in this starter. New accounts should be created by a trusted Admin.</p></div></div><div className="notice">Do not allow public registration. New users should be created in Supabase Auth by the Admin and then assigned their role through a controlled admin-only workflow.</div><section className="panel"><div className="panel-head"><h3>Team profiles</h3></div><div className="table-wrap"><table><thead><tr><th>Name</th><th>Role</th><th>Status</th><th>Created</th></tr></thead><tbody>{data?.map(p => <tr key={p.id}><td><strong>{p.full_name || "Unnamed user"}</strong></td><td><span className="tag">{p.role}</span></td><td><span className={`tag ${p.is_active ? "green" : "red"}`}>{p.is_active ? "Active" : "Inactive"}</span></td><td>{new Date(p.created_at).toLocaleDateString("en-IN")}</td></tr>)}</tbody></table></div></section></>;
}

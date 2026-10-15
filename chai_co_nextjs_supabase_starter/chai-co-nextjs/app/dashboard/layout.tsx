import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("full_name, role, is_active").eq("id", user.id).maybeSingle();
  if (!profile?.is_active) {
    await supabase.auth.signOut();
    redirect("/login?error=inactive");
  }

  const role = profile.role as "admin" | "manager" | "staff";
  const links = [
    { href: "/dashboard", label: "Overview", roles: ["admin", "manager", "staff"] },
    { href: "/dashboard/sales", label: "Daily sales", roles: ["admin", "manager", "staff"] },
    { href: "/dashboard/inventory", label: "Inventory", roles: ["admin", "manager", "staff"] },
    { href: "/dashboard/recipes", label: "Recipes & costing", roles: ["admin", "manager", "staff"] },
    { href: "/dashboard/purchases", label: "Purchases", roles: ["admin", "manager"] },
    { href: "/dashboard/expenses", label: "Expenses", roles: ["admin", "manager"] },
    { href: "/dashboard/team", label: "Team & shifts", roles: ["admin", "manager", "staff"] },
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">C<span style={{fontSize: 11}}>&amp;</span></div><div><h1>Chai &amp; Co.</h1><p>Shop management</p></div></div>
        <div className="nav-wrap">
          <div><div className="nav-label">WORKSPACE</div><nav className="nav">{links.filter(link => link.roles.includes(role)).map(link => <Link href={link.href} key={link.href}>{link.label}</Link>)}</nav></div>
        </div>
        <div className="sidebar-bottom"><strong>{profile.full_name || user.email}</strong><span>{role.toUpperCase()} · authenticated</span><form action={signOut} style={{marginTop: 12}}><button className="btn" type="submit">Sign out</button></form></div>
      </aside>
      <main className="main">
        <header className="topbar"><div className="crumb">Chai &amp; Co. <strong> / Shop workspace</strong></div><div className="tag">{role.toUpperCase()}</div></header>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}

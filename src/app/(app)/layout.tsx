import { AmbientBackground } from "@/components/ambient-background";
import { BottomNav, SideNav } from "@/components/app-nav";
import { Crest } from "@/components/crest";
import { requireMember } from "@/server/auth/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const me = await requireMember();
  return (
    <div className="flex min-h-dvh">
      <AmbientBackground />
      <SideNav role={me.role} isAdmin={me.isAdmin} name={me.name} image={me.image} crest={<Crest size={44} />} />
      <main className="min-w-0 flex-1 px-4 pt-6 pb-32 md:px-10 md:pt-10 md:pb-16">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
      <BottomNav role={me.role} isAdmin={me.isAdmin} />
    </div>
  );
}

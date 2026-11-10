import type { Metadata } from "next";
import { ProfileForm } from "@/components/profile-form";
import { SignOutButton } from "@/components/sign-in-buttons";
import { buttonClass, PageHeader } from "@/components/ui";
import { requireMember } from "@/server/auth/session";
import { getMember } from "@/server/queries/squad";
import { AdminSettings } from "./admin-settings";

export const metadata: Metadata = { title: "Settings" };

/** Everyone's profile and sign out; admins also get the app's own settings underneath. */
export default async function SettingsPage() {
  const me = await requireMember();
  const profile = await getMember(me.id);
  if (!profile) return null;
  return (
    <>
      <PageHeader title="Settings">
        <SignOutButton className={buttonClass("ghost")} />
      </PageHeader>
      <div className="space-y-12">
        <ProfileForm profile={profile} />
        {me.isAdmin && <AdminSettings />}
      </div>
    </>
  );
}

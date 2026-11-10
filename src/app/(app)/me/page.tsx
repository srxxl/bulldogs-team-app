import type { Metadata } from "next";
import { ProfileForm } from "@/components/profile-form";
import { SignOutButton } from "@/components/sign-in-buttons";
import { buttonClass, PageHeader } from "@/components/ui";
import { requireMember } from "@/server/auth/session";
import { getMember } from "@/server/queries/squad";

export const metadata: Metadata = { title: "My profile" };

export default async function MePage() {
  const me = await requireMember();
  const profile = await getMember(me.id);
  if (!profile) return null;
  return (
    <>
      <PageHeader title="My profile">
        <SignOutButton className={buttonClass("ghost")} />
      </PageHeader>
      <ProfileForm profile={profile} />
    </>
  );
}

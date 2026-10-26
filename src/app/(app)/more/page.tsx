import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { ALL, visibleNav } from "@/components/nav-items";
import { requireMember } from "@/server/auth/session";

export const metadata: Metadata = { title: "More" };

export default async function MorePage() {
  const me = await requireMember();
  const items = visibleNav(ALL, me).filter((i) => !["/", "/fixture", "/training", "/squad"].includes(i.href));
  return (
    <>
      <Link href="/me" className="mb-6 flex items-center gap-4 rounded-2xl bg-navy p-4 text-white">
        <Avatar name={me.name} src={me.image} size={56} />
        <span>
          <span className="block font-display text-3xl font-bold leading-none">{me.name}</span>
          <span className="text-sm text-powder">Edit my profile</span>
        </span>
      </Link>
      <ul className="grid grid-cols-2 gap-3">
        {items.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex min-h-28 flex-col justify-between rounded-2xl bg-white p-4 transition-colors hover:bg-mist"
            >
              <Icon className="text-red" />
              <span className="font-display text-2xl font-bold leading-tight text-navy">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

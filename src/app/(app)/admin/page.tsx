import type { Metadata } from "next";
import {
  ApproveButtons,
  LadderPasteForm,
  RoleSelect,
  SeasonStartForm,
  SyncButton,
  TrainingToggle,
} from "@/components/admin-controls";
import { Avatar } from "@/components/avatar";
import { ButtonLink, PageHeader, Panel, SectionTitle } from "@/components/ui";
import { formatDay, formatTime } from "@/lib/time";
import { requireRole } from "@/server/auth/session";
import { playHqConfig } from "@/server/playhq/client";
import { getSetting } from "@/server/queries/settings";
import { getAllUsers } from "@/server/queries/squad";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  const me = await requireRole("coach");
  const [users, trainingEnabled, seasonStart, lastSync] = await Promise.all([
    getAllUsers(),
    getSetting("training_enabled"),
    getSetting("season_start"),
    getSetting("playhq_last_sync"),
  ]);
  const pending = users.filter((u) => u.role === "pending");
  const members = users.filter((u) => u.role !== "pending");
  const connected = playHqConfig() !== null;

  return (
    <>
      <PageHeader title="Admin" intro="Approve players, manage the fixture and keep the PFL data up to date.">
        <ButtonLink href="/admin/events/new">Add event</ButtonLink>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="lg:col-span-2">
          <SectionTitle>
            Waiting to join{" "}
            {pending.length > 0 && (
              <span className="ml-2 rounded-full bg-red px-2.5 align-middle font-sans text-sm text-white">
                {pending.length}
              </span>
            )}
          </SectionTitle>
          {pending.length === 0 ? (
            <p className="text-sm text-ink/60">No one's waiting. New sign-ups show up here.</p>
          ) : (
            <ul className="divide-y divide-ink/10">
              {pending.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center gap-3 py-3">
                  <Avatar name={u.name} src={u.image} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{u.name}</p>
                    <p className="truncate text-sm text-ink/60">
                      {u.email}, signed up {formatDay(u.createdAt)}
                    </p>
                  </div>
                  <ApproveButtons userId={u.id} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <SectionTitle>PFL data</SectionTitle>
          <div className="space-y-6">
            <div>
              <h3 className="mb-1 text-xl font-bold text-navy">PlayHQ sync</h3>
              {connected ? (
                <p className="mb-3 text-sm text-ink/70">
                  Fixture and ladder sync every morning.
                  {lastSync &&
                    ` Last run ${formatDay(new Date(lastSync.at))} ${formatTime(new Date(lastSync.at))}: ${lastSync.message}`}
                </p>
              ) : (
                <p className="mb-3 text-sm text-ink/70">
                  Not connected. Ask the club's PlayHQ admin to request a public API key from PlayHQ, then add
                  PLAYHQ_API_KEY, PLAYHQ_TEAM_ID and PLAYHQ_GRADE_ID in Vercel. Until then, paste the ladder below and
                  add games by hand.
                </p>
              )}
              <SyncButton connected={connected} />
            </div>
            <LadderPasteForm />
          </div>
        </Panel>

        <Panel>
          <SectionTitle>Season</SectionTitle>
          <div className="space-y-6">
            <TrainingToggle enabled={trainingEnabled} />
            <SeasonStartForm value={seasonStart} />
          </div>
        </Panel>

        <Panel className="lg:col-span-2">
          <SectionTitle>Members</SectionTitle>
          <ul className="divide-y divide-ink/10">
            {members.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-3 py-3">
                <Avatar name={u.name} src={u.image} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {u.name}
                    {u.id === me.id && <span className="font-normal text-ink/50"> (you)</span>}
                  </p>
                  <p className="truncate text-sm text-ink/60">{u.email}</p>
                </div>
                {u.id !== me.id && <RoleSelect userId={u.id} role={u.role} canRemove={me.role === "admin"} />}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}

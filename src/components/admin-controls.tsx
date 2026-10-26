"use client";

import { RefreshCw, Trash2 } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import type { ActionResult } from "@/lib/action-result";
import { ROLE_LABEL } from "@/lib/roles";
import {
  importLadder,
  removeMember,
  runPlayHqSync,
  setAdmin,
  setRole,
  setSeasonStart,
  setTrainingEnabled,
} from "@/server/actions/admin";
import type { Role } from "@/server/db/schema";
import { Field, FormMessage, Input, Select, SubmitButton, Textarea } from "./forms";
import { Button } from "./ui";

const ROLES: Role[] = ["pending", "player", "captain", "coach"];

function useAction() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const run = (fn: () => Promise<ActionResult>) => start(async () => setResult(await fn()));
  return { pending, result, run };
}

export function ApproveButtons({ userId }: { userId: string }) {
  const { pending, result, run } = useAction();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button disabled={pending} onClick={() => run(() => setRole(userId, "player"))}>
        Let them in
      </Button>
      <Button
        variant="ghost"
        disabled={pending}
        onClick={() => confirm("Remove this sign-up?") && run(() => removeMember(userId))}
      >
        Not on the team
      </Button>
      {result && !result.ok && <span className="text-sm text-red">{result.error}</span>}
    </div>
  );
}

/** Team role, admin access and removal for one member. */
export function MemberControls({ userId, role, isAdmin }: { userId: string; role: Role; isAdmin: boolean }) {
  const { pending, result, run } = useAction();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        aria-label="Team role"
        defaultValue={role}
        disabled={pending}
        onChange={(e) => run(() => setRole(userId, e.target.value as Role))}
        className="min-h-10 w-auto py-1.5 text-sm"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r === "pending" ? "No access" : ROLE_LABEL[r]}
          </option>
        ))}
      </Select>
      <label className="flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-medium">
        <input
          type="checkbox"
          className="size-5 accent-navy"
          defaultChecked={isAdmin}
          disabled={pending}
          onChange={(e) => run(() => setAdmin(userId, e.target.checked))}
        />
        Admin
      </label>
      <button
        type="button"
        aria-label="Remove member"
        disabled={pending}
        onClick={() => confirm("Remove this member and all their data?") && run(() => removeMember(userId))}
        className="grid size-10 place-items-center rounded-xl text-ink/40 hover:bg-mist hover:text-red"
      >
        <Trash2 size={16} />
      </button>
      {result && !result.ok && <span className="text-sm text-red">{result.error}</span>}
    </div>
  );
}

export function TrainingToggle({ enabled }: { enabled: boolean }) {
  const { pending, result, run } = useAction();
  return (
    <div className="space-y-2">
      <label className="flex min-h-11 items-center gap-3 font-medium">
        <input
          type="checkbox"
          className="size-5 accent-navy"
          defaultChecked={enabled}
          disabled={pending}
          onChange={(e) => run(() => setTrainingEnabled(e.target.checked))}
        />
        Create Tuesday and Thursday training polls
      </label>
      <FormMessage state={result} />
    </div>
  );
}

export function SeasonStartForm({ value }: { value: string }) {
  const [state, action] = useActionState(setSeasonStart, null);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <Field label="Season starts" name="seasonStart" state={state} hint="Votes are tallied from this date.">
        <Input type="date" name="seasonStart" defaultValue={value} className="w-auto" />
      </Field>
      <SubmitButton className="mb-6">Save</SubmitButton>
      <div className="basis-full">
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function SyncButton({ connected }: { connected: boolean }) {
  const { pending, result, run } = useAction();
  return (
    <div className="space-y-2">
      <Button disabled={!connected || pending} onClick={() => run(runPlayHqSync)}>
        <RefreshCw size={16} className={pending ? "animate-spin" : undefined} /> {pending ? "Syncing…" : "Sync now"}
      </Button>
      <FormMessage state={result} />
    </div>
  );
}

export function LadderPasteForm() {
  const [state, action] = useActionState(importLadder, null);
  return (
    <form action={action} className="space-y-3">
      <Field
        label="Paste the ladder"
        name="ladder"
        state={state}
        hint="On playhq.com open the C3 Women ladder, select the whole table including the header row, copy, and paste it here."
      >
        <Textarea
          name="ladder"
          rows={6}
          required
          state={state}
          className="font-[inherit] text-sm"
          placeholder={"Pos\tTeam\tP\tW\tL\tD\t…"}
        />
      </Field>
      <FormMessage state={state} />
      <SubmitButton pending="Importing…">Update ladder</SubmitButton>
    </form>
  );
}

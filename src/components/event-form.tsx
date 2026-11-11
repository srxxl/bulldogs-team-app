"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useTransition } from "react";
import { deleteEvent, saveEvent } from "@/server/actions/admin";
import type { EventKind } from "@/server/db/schema";
import { Field, FormMessage, Input, Select, SubmitButton, Textarea } from "./forms";
import { Button, Panel } from "./ui";

export type EventFormValues = {
  id?: string;
  kind: EventKind;
  title: string;
  startsAt: string;
  endsAt: string;
  venueName: string;
  venueAddress: string;
  details: string;
  round: string;
  opponent: string;
  isHome: "home" | "away" | "";
  isFinal: boolean;
  cancelled: boolean;
  teamGoals: string;
  teamBehinds: string;
  oppGoals: string;
  oppBehinds: string;
  synced: boolean;
};

export function EventForm({ values }: { values: EventFormValues }) {
  const router = useRouter();
  const [state, action] = useActionState(saveEvent, null);
  const [deleting, startDelete] = useTransition();
  useEffect(() => {
    if (state?.ok && state.data) router.push(`/fixture/${state.data.id}`);
  }, [state, router]);

  const game = values.kind === "game";
  return (
    <form action={action} className="grid gap-6 lg:grid-cols-2">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <Panel className="space-y-4">
        {values.synced && (
          <p className="rounded-xl bg-mist p-3 text-sm text-navy">
            This game comes from PlayHQ. The next sync will overwrite changes to the date, venue and score.
          </p>
        )}
        {/* a new event is always a game (the fixture is games only); editing keeps its kind (a game or a training) */}
        <input type="hidden" name="kind" value={values.kind} />
        {game ? (
          <>
            <Field label="Opponent" name="opponent" state={state}>
              <Input name="opponent" defaultValue={values.opponent} required state={state} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Round" name="round" state={state}>
                <Input name="round" defaultValue={values.round} placeholder="Round 1" state={state} />
              </Field>
              <Field label="Home or away" name="isHome" state={state}>
                <Select name="isHome" defaultValue={values.isHome}>
                  <option value="">Not sure yet</option>
                  <option value="home">Home</option>
                  <option value="away">Away</option>
                </Select>
              </Field>
            </div>
            <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
              <input type="checkbox" name="isFinal" defaultChecked={values.isFinal} className="size-5 accent-navy" />{" "}
              It's a final
            </label>
          </>
        ) : (
          <Field label="Name" name="title" state={state}>
            <Input name="title" defaultValue={values.title} required state={state} />
          </Field>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Starts" name="startsAt" state={state} hint="Perth time">
            <Input type="datetime-local" name="startsAt" defaultValue={values.startsAt} required state={state} />
          </Field>
          <Field label="Ends" name="endsAt" state={state}>
            <Input type="datetime-local" name="endsAt" defaultValue={values.endsAt} state={state} />
          </Field>
        </div>
        <Field label="Venue" name="venueName" state={state}>
          <Input
            name="venueName"
            defaultValue={values.venueName}
            placeholder="Karoonda Reserve, Oval 1"
            state={state}
          />
        </Field>
        <Field label="Address" name="venueAddress" state={state} hint="Used for the directions link">
          <Input name="venueAddress" defaultValue={values.venueAddress} state={state} />
        </Field>
      </Panel>
      <Panel className="space-y-4">
        {game && (
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Final score (goals.behinds)</legend>
            <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-2">
              <span className="text-sm font-semibold">Bulldogs</span>
              <Input
                aria-label="Our goals"
                name="teamGoals"
                type="number"
                min={0}
                inputMode="numeric"
                defaultValue={values.teamGoals}
                placeholder="G"
              />
              <Input
                aria-label="Our behinds"
                name="teamBehinds"
                type="number"
                min={0}
                inputMode="numeric"
                defaultValue={values.teamBehinds}
                placeholder="B"
              />
              <span className="text-sm font-semibold">Them</span>
              <Input
                aria-label="Their goals"
                name="oppGoals"
                type="number"
                min={0}
                inputMode="numeric"
                defaultValue={values.oppGoals}
                placeholder="G"
              />
              <Input
                aria-label="Their behinds"
                name="oppBehinds"
                type="number"
                min={0}
                inputMode="numeric"
                defaultValue={values.oppBehinds}
                placeholder="B"
              />
            </div>
          </fieldset>
        )}
        <Field
          label="Details"
          name="details"
          state={state}
          hint="Arrival time, what to bring, parking, umpiring duties…"
        >
          <Textarea name="details" defaultValue={values.details} rows={5} state={state} />
        </Field>
        <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
          <input type="checkbox" name="cancelled" defaultChecked={values.cancelled} className="size-5 accent-red" />{" "}
          Cancelled
        </label>
        <FormMessage state={state} />
        <div className="flex flex-wrap gap-2">
          <SubmitButton>{values.id ? "Save changes" : "Add game"}</SubmitButton>
          {values.id && (
            <Button
              variant="ghost"
              className="text-red"
              disabled={deleting}
              onClick={() =>
                confirm("Delete this event? RSVPs, votes and the team board go with it.") &&
                startDelete(async () => {
                  const res = await deleteEvent(values.id as string);
                  if (res.ok) router.push("/fixture");
                })
              }
            >
              Delete event
            </Button>
          )}
        </div>
      </Panel>
    </form>
  );
}

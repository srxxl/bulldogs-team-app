"use client";

import { useActionState } from "react";
import { POSITIONS } from "@/lib/positions";
import { updateProfile } from "@/server/actions/profile";
import type { SquadMember } from "@/server/queries/squad";
import { Avatar } from "./avatar";
import { Field, FormMessage, Input, Select, SubmitButton, Textarea } from "./forms";
import { Panel } from "./ui";

export function ProfileForm({ profile }: { profile: SquadMember }) {
  const [state, action] = useActionState(updateProfile, null);
  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <Panel className="space-y-5">
        <div className="flex items-center gap-4">
          <Avatar name={profile.displayName} src={profile.image} size={72} />
          <Field label="Photo" name="photo" state={state} hint="Up to 5 MB.">
            <Input
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="py-2 file:mr-3 file:rounded-lg file:border-0 file:bg-mist file:px-3 file:py-1.5 file:font-semibold file:text-navy"
            />
          </Field>
        </div>
        <Field
          label="Name on the team sheet"
          name="preferredName"
          state={state}
          hint={`Leave blank to use ${profile.name}`}
        >
          <Input
            name="preferredName"
            defaultValue={profile.displayName === profile.name ? "" : profile.displayName}
            maxLength={40}
            state={state}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Guernsey number" name="guernsey" state={state}>
            <Input
              name="guernsey"
              type="number"
              inputMode="numeric"
              min={1}
              max={99}
              defaultValue={profile.guernsey ?? ""}
              state={state}
            />
          </Field>
          <Field label="Years playing" name="yearsPlaying" state={state}>
            <Input
              name="yearsPlaying"
              type="number"
              inputMode="numeric"
              min={0}
              max={60}
              defaultValue={profile.yearsPlaying ?? ""}
              state={state}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Main position" name="position" state={state}>
            <Select name="position" defaultValue={profile.position}>
              {POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Also plays" name="secondaryPosition" state={state}>
            <Select name="secondaryPosition" defaultValue={profile.secondaryPosition ?? ""}>
              <option value="">Nowhere else</option>
              {POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Panel>
      <Panel className="space-y-5">
        <Field label="About me" name="bio" state={state}>
          <Textarea name="bio" defaultValue={profile.bio ?? ""} maxLength={600} rows={5} state={state} />
        </Field>
        <Field label="Footy hero" name="footyHero" state={state}>
          <Input name="footyHero" defaultValue={profile.footyHero ?? ""} maxLength={80} state={state} />
        </Field>
        <Field label="Pre-game song" name="preGameSong" state={state}>
          <Input name="preGameSong" defaultValue={profile.preGameSong ?? ""} maxLength={80} state={state} />
        </Field>
        <Field label="Off the field" name="occupation" state={state} hint="Work, study, the dog you're obsessed with.">
          <Input name="occupation" defaultValue={profile.occupation ?? ""} maxLength={80} state={state} />
        </Field>
        <FormMessage state={state} />
        <SubmitButton className="w-full sm:w-auto">Save profile</SubmitButton>
      </Panel>
    </form>
  );
}

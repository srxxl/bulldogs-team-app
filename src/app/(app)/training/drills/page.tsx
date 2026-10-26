import type { Metadata } from "next";
import { AddPinSheet } from "@/components/pin-actions";
import { PinBoard } from "@/components/pin-board";
import { PageHeader } from "@/components/ui";
import { canLead } from "@/lib/roles";
import { requireMember } from "@/server/auth/session";
import { getPins } from "@/server/queries/content";

export const metadata: Metadata = { title: "Drills" };

export default async function DrillsPage() {
  const me = await requireMember();
  const pins = await getPins("drills");
  return (
    <>
      <PageHeader
        title="Drills"
        intro="What we run at training, so you can practise on your own and know what's coming."
      >
        {canLead(me.role) && (
          <AddPinSheet
            board="drills"
            label="Add a drill"
            tags={["Skills", "Contested", "Fitness", "Match sim", "Warm-up"]}
          />
        )}
      </PageHeader>
      <PinBoard
        pins={pins}
        me={me}
        empty={{
          title: "No drills yet",
          body: "Coaches and captains can add the drills you run at training.",
        }}
      />
    </>
  );
}

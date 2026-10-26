import { ButtonLink } from "@/components/ui";

export default function Forbidden() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <h1 className="text-6xl font-extrabold text-navy">Coaches only</h1>
        <p className="mt-3 text-ink/70">This part of the app is for coaches and captains.</p>
        <ButtonLink href="/" className="mt-6">
          Back to home
        </ButtonLink>
      </div>
    </main>
  );
}

import { ButtonLink } from "@/components/ui";

export default function Forbidden() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <h1 className="text-6xl font-extrabold text-navy">Not for this account</h1>
        <p className="mt-3 text-ink/70">
          This part of the app is only open to certain roles. Ask your team admin if you think you need it.
        </p>
        <ButtonLink href="/fixture" className="mt-6">
          Back to the fixture
        </ButtonLink>
      </div>
    </main>
  );
}

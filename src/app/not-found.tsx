import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="display-num num-outline text-[10rem] text-navy">404</p>
        <h1 className="text-4xl font-extrabold text-navy">Out on the full</h1>
        <p className="mt-3 text-ink/70">That page doesn't exist.</p>
        <ButtonLink href="/fixture" className="mt-6">
          Back to the fixture
        </ButtonLink>
      </div>
    </main>
  );
}

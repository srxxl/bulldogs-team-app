import { ensureTraining, syncPlayHq } from "@/server/sync";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const [trainingCreated, playhq] = await Promise.all([ensureTraining(), syncPlayHq()]);
  return Response.json({ trainingCreated, playhq });
}

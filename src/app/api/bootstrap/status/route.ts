import { dashboardSummary, tenants } from "@/server/mock-data";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    mode: "migration",
    stack: "next-monolith",
    hasTenants: tenants.length > 0,
    cards: dashboardSummary,
    message: "Estrutura inicial pronta para substituir o frontend Vite e incorporar backend no próprio app.",
  });
}

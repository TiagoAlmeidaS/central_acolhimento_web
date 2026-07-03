import { getDashboardSummary } from "@/server/repositories/mvp-repository";

export async function GET() {
  try {
    const cards = await getDashboardSummary();
    return Response.json(cards);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao carregar dashboard." },
      { status: 500 }
    );
  }
}

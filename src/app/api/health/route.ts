export async function GET() {
  return Response.json({
    ok: true,
    service: "central-acolhimento-monolith",
    framework: "next",
    timestamp: new Date().toISOString(),
  });
}

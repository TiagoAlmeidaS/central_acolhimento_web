export const dynamic = "force-dynamic";

import { findAppUserByEmail, createPasswordResetToken } from "@/server/repositories/auth-repository";
import { sendPasswordResetEmail } from "@/lib/email";

// Rate limit in-memory simples por IP (suficiente para o volume da central)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

export async function POST(request: Request) {
  try {
    // Rate limiting por IP
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    if (!checkRateLimit(ip)) {
      return Response.json(
        { message: "Muitas tentativas. Aguarde 15 minutos e tente novamente." },
        { status: 429 }
      );
    }

    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase() ?? "";

    if (!email) {
      return Response.json({ error: "E-mail obrigatório." }, { status: 400 });
    }

    // Sempre retorna 200 genérico — não revela se o e-mail existe ou não
    const GENERIC_OK = Response.json({
      message: "Se o e-mail estiver cadastrado, você receberá um link em instantes.",
    });

    const user = await findAppUserByEmail(email);
    if (!user) return GENERIC_OK;

    const rawToken = await createPasswordResetToken(user.id);

    try {
      await sendPasswordResetEmail({
        to: email,
        userName: user.firstName,
        resetToken: rawToken,
      });
    } catch (emailError) {
      // Loga o erro mas não expõe ao cliente — não deve revelar detalhes internos
      console.error("[forgot-password] Erro ao enviar e-mail:", emailError);
    }

    return GENERIC_OK;
  } catch (error) {
    console.error("[forgot-password]", error);
    return Response.json(
      { error: "Não foi possível processar a solicitação." },
      { status: 500 }
    );
  }
}

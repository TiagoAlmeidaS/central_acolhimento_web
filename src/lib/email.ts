/**
 * Serviço de envio de e-mail transacional via Resend.
 *
 * Variáveis de ambiente necessárias:
 *   RESEND_API_KEY  — chave da API do Resend (obrigatória)
 *   EMAIL_FROM      — remetente (ex: "Central de Acolhimento <noreply@dominio.com.br>")
 *   NEXT_PUBLIC_APP_URL — URL base do app (para montar links nos e-mails)
 */

import { Resend } from "resend";

const EMAIL_FROM =
  process.env.EMAIL_FROM ??
  "Central de Acolhimento <onboarding@resend.dev>";

function getAppBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000")
  );
}

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY não configurado. Adicione a variável de ambiente para habilitar o envio de e-mails."
    );
  }
  return new Resend(apiKey);
}

/**
 * Envia o e-mail de redefinição de senha.
 * O `resetToken` é o token BRUTO (64 chars hex) — nunca o hash armazenado no banco.
 */
export async function sendPasswordResetEmail(input: {
  to: string;
  userName: string;
  resetToken: string;
}) {
  const resetUrl = `${getAppBaseUrl()}/redefinir-senha?token=${input.resetToken}`;

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 24px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:20px;border:1px solid #e4e4e7;overflow:hidden">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#2563eb 0%,#7c3aed 100%);padding:32px 32px 28px;text-align:center">
            <p style="margin:0;font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.03em">Central de Acolhimento</p>
            <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.8)">Sistema de Gestão Pastoral</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 32px">
            <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#18181b">Olá, ${input.userName}!</h2>
            <p style="margin:0 0 12px;font-size:15px;color:#52525b;line-height:1.6">
              Recebemos uma solicitação para redefinir a senha da sua conta na Central de Acolhimento.
            </p>
            <p style="margin:0 0 28px;font-size:15px;color:#52525b;line-height:1.6">
              Clique no botão abaixo para criar uma nova senha. O link expira em <strong>30 minutos</strong>.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto">
              <tr>
                <td style="border-radius:12px;background:#2563eb">
                  <a href="${resetUrl}"
                     style="display:block;padding:14px 32px;font-size:15px;font-weight:700;color:#fff;text-decoration:none;letter-spacing:-0.01em">
                    Redefinir minha senha
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:28px 0 0;font-size:13px;color:#a1a1aa;line-height:1.6;text-align:center">
              Se você não solicitou a redefinição de senha, ignore este e-mail.<br>
              Sua senha permanece a mesma.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f4f4f5;text-align:center">
            <p style="margin:0;font-size:12px;color:#a1a1aa">Central de Acolhimento · Sistema Pastoral</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const resend = getResend();
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: [input.to],
    subject: "Redefinição de Senha — Central de Acolhimento",
    html,
  });

  if (error) {
    throw new Error(`Falha ao enviar e-mail de redefinição: ${error.message}`);
  }
}

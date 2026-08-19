"use client";

import { useEffect } from "react";
import { Button } from "@/ui/v2-components/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log do erro no lado do cliente
    console.error("Erro capturado pela Error Boundary do Next.js:", error);
  }, [error]);

  return (
    <div
      className="bg-mesh flex min-h-screen flex-col items-center justify-center p-4 text-center"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <div
        className="w-full max-w-md rounded-3xl border p-8 shadow-panel"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <div className="mb-6 flex justify-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              backgroundColor: "var(--status-urgente-bg)",
              color: "var(--status-urgente)",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-8 w-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
        </div>

        <h2
          className="mb-2 text-2xl font-bold tracking-tight"
          style={{ color: "var(--text)" }}
        >
          Ops! Algo deu errado
        </h2>
        <p
          className="mb-6 text-sm"
          style={{ color: "var(--text-2)" }}
        >
          Ocorreu um erro ao processar esta página. A equipe de coordenação foi informada.
        </p>

        {error.digest && (
          <div
            className="mb-6 rounded-xl p-4 text-left border"
            style={{
              backgroundColor: "var(--surface-2)",
              borderColor: "var(--border)",
            }}
          >
            <span
              className="block text-[10px] font-bold uppercase tracking-wider mb-1"
              style={{ color: "var(--text-3)" }}
            >
              Código do Erro (Digest)
            </span>
            <code
              className="text-xs break-all select-all font-mono"
              style={{ color: "var(--text)" }}
            >
              {error.digest}
            </code>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="primary" size="md" onClick={() => reset()}>
            Tentar novamente
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => (window.location.href = "/")}
          >
            Ir para o início
          </Button>
        </div>
      </div>
    </div>
  );
}

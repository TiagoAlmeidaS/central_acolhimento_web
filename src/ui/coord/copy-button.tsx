"use client";

import { useState } from "react";
import { Button, useToast } from "@/ui/atalaia";

/** Copia um link para a area de transferencia e confirma com texto e toast. */
export function CopyButton({ link, label = "Copiar link" }: { link: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast("Link copiado.");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast("Não foi possível copiar. Selecione o link e copie.", { tone: "error" });
    }
  }

  return (
    <Button size="sm" icon={copied ? "check" : "copy"} onClick={handleCopy}>
      {copied ? "Copiado" : label}
    </Button>
  );
}

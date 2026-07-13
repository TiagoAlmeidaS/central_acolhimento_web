import type { Caregiver, Member, Tenant } from "@/server/domain/mvp";

export function formatParticipantAvailabilityMessage(input: {
  tenant: Tenant | null;
  selectedType: "member" | "caregiver" | "guest";
  members: Member[];
  caregivers: Caregiver[];
}) {
  const tenantName = input.tenant?.name ?? "a localidade selecionada";

  if (input.selectedType === "guest") {
    return "Participantes avulsos podem ser adicionados manualmente, mesmo sem base cadastrada.";
  }

  if (input.selectedType === "member") {
    if (input.members.length === 0) {
      return `Nenhum membro encontrado em ${tenantName}. Cadastre membros nessa localidade para liberar a selecao.`;
    }

    return `${input.members.length} membro(s) disponivel(is) em ${tenantName}.`;
  }

  if (input.caregivers.length === 0) {
    return `Nenhum cuidador encontrado em ${tenantName}. Cadastre ou vincule cuidadores nessa localidade para liberar a selecao.`;
  }

  return `${input.caregivers.length} cuidador(es) disponivel(is) em ${tenantName}.`;
}

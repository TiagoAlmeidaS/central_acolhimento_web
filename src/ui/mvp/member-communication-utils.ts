import type { Caregiver, Member } from "@/server/domain/mvp";

export type CaregiverCommunicationGroup = {
  caregiver: Caregiver;
  members: Member[];
  message: string;
  warnings: string[];
};

export type CaregiverCommunicationResult = {
  groups: CaregiverCommunicationGroup[];
  membersWithoutCaregiver: Member[];
};

function formatMemberPhone(phone: string) {
  const trimmedPhone = phone.trim();
  return trimmedPhone || "telefone nao informado";
}

export function buildCaregiverContactMessage(caregiverName: string, members: Member[]) {
  const memberLines = members
    .map((member) => `- ${member.name} - ${formatMemberPhone(member.phone)}`)
    .join("\n");
  const intro =
    members.length === 1
      ? "Segue o contato da pessoa que esta sob o seu cuidado:"
      : "Seguem os contatos das pessoas que estao sob o seu cuidado:";

  return [
    `Ola, ${caregiverName}! Tudo bem?`,
    "",
    intro,
    "",
    memberLines,
    "",
    "Deus abencoe seu cuidado com cada um deles!",
  ].join("\n");
}

export function groupSelectedMembersByCaregiver(
  members: Member[],
  caregivers: Caregiver[],
  selectedMemberIds: string[],
): CaregiverCommunicationResult {
  const selectedMemberIdSet = new Set(selectedMemberIds);
  const caregiversById = new Map(caregivers.map((caregiver) => [caregiver.id, caregiver]));
  const groupedMembers = new Map<string, Member[]>();
  const membersWithoutCaregiver: Member[] = [];

  for (const member of members) {
    if (!selectedMemberIdSet.has(member.id)) {
      continue;
    }

    if (!member.caregiverId || !caregiversById.has(member.caregiverId)) {
      membersWithoutCaregiver.push(member);
      continue;
    }

    const currentMembers = groupedMembers.get(member.caregiverId) ?? [];
    currentMembers.push(member);
    groupedMembers.set(member.caregiverId, currentMembers);
  }

  const groups = Array.from(groupedMembers.entries()).map(([caregiverId, groupMembers]) => {
    const caregiver = caregiversById.get(caregiverId)!;
    const warnings: string[] = [];

    if (!caregiver.phone.trim()) {
      warnings.push("Cuidador sem telefone cadastrado.");
    }

    const membersWithoutPhone = groupMembers.filter((member) => !member.phone.trim());
    if (membersWithoutPhone.length > 0) {
      warnings.push(
        `${membersWithoutPhone.length} ${
          membersWithoutPhone.length === 1 ? "membro selecionado esta" : "membros selecionados estao"
        } sem telefone.`,
      );
    }

    return {
      caregiver,
      members: groupMembers,
      message: buildCaregiverContactMessage(caregiver.name, groupMembers),
      warnings,
    };
  });

  return {
    groups: groups.sort((first, second) => first.caregiver.name.localeCompare(second.caregiver.name, "pt-BR")),
    membersWithoutCaregiver,
  };
}

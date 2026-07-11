export type DashboardMapItem = {
  id: string;
  name: string;
  city: string;
  address: string;
  status: string;
  caregiver: string | null;
  lastContact: string | null;
  latitude: number | null;
  longitude: number | null;
  age?: number | null;
  birthDate?: string | null;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatBirthDateLabel(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    return `${dateOnlyMatch[3]}/${dateOnlyMatch[2]}/${dateOnlyMatch[1]}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("pt-BR");
}

export function buildMapPopupContent(
  item: DashboardMapItem,
  options: { color: string; statusLabel: string }
) {
  const ageLabel = item.age !== null && item.age !== undefined ? `${item.age} anos` : null;
  const birthDateLabel = formatBirthDateLabel(item.birthDate);

  return `
    <div style="
      font-family: var(--font-sans), sans-serif;
      font-size: 13px;
      color: #0F172A;
      line-height: 1.4;
      padding: 2px;
      min-width: 180px;
    ">
      <div style="font-weight: 800; font-size: 14.5px; color: #1E293B; margin-bottom: 4px;">
        ${escapeHtml(item.name)}
      </div>
      <div style="
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        color: ${options.color};
        margin-bottom: 8px;
      ">
        ● ${escapeHtml(options.statusLabel)}
      </div>
      <div style="margin-bottom: 2px;">
        <strong style="color: #64748B;">Endereco:</strong> ${escapeHtml(item.address || "Sem endereco")}
      </div>
      ${
        ageLabel
          ? `<div style="margin-bottom: 2px;"><strong style="color: #64748B;">Idade:</strong> ${escapeHtml(ageLabel)}</div>`
          : ""
      }
      ${
        birthDateLabel
          ? `<div style="margin-bottom: 2px;"><strong style="color: #64748B;">Nascimento:</strong> ${escapeHtml(birthDateLabel)}</div>`
          : ""
      }
      <div style="margin-bottom: 2px;">
        <strong style="color: #64748B;">Cuidador:</strong> ${escapeHtml(item.caregiver || "Nao atribuido")}
      </div>
      <div>
        <strong style="color: #64748B;">Ultimo contato:</strong> ${escapeHtml(item.lastContact || "Nenhum registrado")}
      </div>
    </div>
  `;
}

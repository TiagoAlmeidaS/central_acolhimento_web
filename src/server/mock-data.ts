export const dashboardSummary = [
  { label: "Membros cadastrados", value: "128", detail: "Base inicial para demo" },
  { label: "Membros ativos", value: "64", detail: "Em acompanhamento" },
  { label: "Sementes", value: "42", detail: "Ainda sem acompanhamento final" },
  { label: "Cuidadores ativos", value: "18", detail: "Distribuídos em 3 cidades" },
];

export const tenants = [
  { id: "1", name: "Central Sapé", city: "Sapé", state: "PB", coordinator: "Tiago", status: "Ativa" },
  { id: "2", name: "Central Mari", city: "Mari", state: "PB", coordinator: "Priscila", status: "Ativa" },
  { id: "3", name: "Central Sobrado", city: "Sobrado", state: "PB", coordinator: "Samuel", status: "Implantacao" },
];

export const caregivers = [
  { id: "1", name: "Maria Oliveira", phone: "(83) 99999-1111", email: "maria@igreja.org", city: "Sapé", active: true, activeMembers: 4 },
  { id: "2", name: "João Silva", phone: "(83) 99999-2222", email: "joao@igreja.org", city: "Mari", active: true, activeMembers: 3 },
  { id: "3", name: "Carla Rocha", phone: "(83) 99999-3333", email: "carla@igreja.org", city: "Sapé", active: false, activeMembers: 0 },
];

export const members = [
  { id: "1", name: "Gabriel Santos", phone: "(83) 98888-1111", status: "Em acompanhamento", caregiver: "Maria Oliveira", city: "Sapé", lastContact: "02/07/2026" },
  { id: "2", name: "Ana Souza", phone: "(83) 98888-2222", status: "Novo", caregiver: "João Silva", city: "Mari", lastContact: "01/07/2026" },
  { id: "3", name: "Lucas Ferreira", phone: "(83) 98888-3333", status: "Consolidado", caregiver: "Maria Oliveira", city: "Sapé", lastContact: "29/06/2026" },
];

export const latestActivity = [
  { member: "Gabriel Santos", note: "Ligação feita. Receptivo e aberto para próxima conversa.", date: "02/07", nextAction: "Próxima ação em 7 dias" },
  { member: "Ana Souza", note: "Primeira visita agendada com o cuidador local.", date: "01/07", nextAction: "Visita em 05/07" },
  { member: "Lucas Ferreira", note: "Consolidado no grupo de discipulado.", date: "29/06", nextAction: "Acompanhar mensalmente" },
];

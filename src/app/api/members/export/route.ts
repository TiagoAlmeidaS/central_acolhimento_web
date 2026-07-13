export const dynamic = "force-dynamic";

import { listAccessibleTenantIds, resolveTenantIdForUserAccess } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { listCaregivers, listMembers, listTenants } from "@/server/repositories/mvp-repository";
import { filterMembers, type MemberListingFilters } from "@/lib/listing-filters";

function escapeCsvValue(value: string | number | boolean | null | undefined) {
  const raw = value === null || value === undefined ? "" : String(value);
  if (/[",\n;]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export async function GET(request: Request) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const { searchParams } = new URL(request.url);
    const requestedTenantId = searchParams.get("tenantId") ?? undefined;
    const accessibleTenantIds = await listAccessibleTenantIds(session);
    const scope = requestedTenantId
      ? { tenantId: await resolveTenantIdForUserAccess(session, requestedTenantId) }
      : { tenantIds: accessibleTenantIds };

    const filters: MemberListingFilters = {
      name: searchParams.get("name") ?? undefined,
      city: searchParams.get("city") ?? undefined,
      tenantId: requestedTenantId ?? "",
      caregiverId: searchParams.get("caregiverId") ?? undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      description: searchParams.get("description") ?? undefined,
      status: (searchParams.get("status") as MemberListingFilters["status"]) ?? "",
    };

    const [members, tenants, caregivers] = await Promise.all([
      listMembers(scope),
      listTenants(scope),
      listCaregivers(scope),
    ]);

    const filtered = filterMembers(members, filters).sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? ""));
    const tenantMap = new Map(tenants.map((tenant) => [tenant.id, tenant]));
    const caregiverMap = new Map(caregivers.map((caregiver) => [caregiver.id, caregiver]));

    const header = [
      "id",
      "nome",
      "idade",
      "telefone",
      "status",
      "cidade",
      "estado",
      "cep",
      "rua",
      "bairro",
      "numero",
      "endereco",
      "data_nascimento",
      "localidade",
      "cuidador",
      "observacoes",
      "latitude",
      "longitude",
      "urgente",
      "seed_id",
      "created_at",
    ];

    const rows = filtered.map((member) => {
      const tenant = tenantMap.get(member.tenantId);
      const caregiver = member.caregiverId ? caregiverMap.get(member.caregiverId) : null;

      return [
        member.id,
        member.name,
        member.age,
        member.phone,
        member.status,
        member.city,
        member.state,
        member.postalCode,
        member.street,
        member.neighborhood,
        member.addressNumber,
        member.address,
        member.birthDate,
        tenant?.name ?? "",
        caregiver?.name ?? member.caregiver ?? "",
        member.notes,
        member.latitude,
        member.longitude,
        member.isUrgent ? "sim" : "nao",
        member.seedId,
        member.createdAt,
      ].map(escapeCsvValue).join(";");
    });

    const csv = [header.join(";"), ...rows].join("\n");
    const fileName = `membros-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao exportar membros." }, { status: 500 });
  }
}

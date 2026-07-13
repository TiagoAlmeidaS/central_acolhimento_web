export const dynamic = "force-dynamic";

import Link from "next/link";
import type { CSSProperties } from "react";
import type { Member } from "@/server/domain/mvp";
import { listCaregivers, listMembers, listMembersPage, listTenants } from "@/server/repositories/mvp-repository";
import { listAccessibleTenantIds } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { MemberList } from "@/ui/mvp/member-list";
import { filterMembers, normalizePage, normalizePageSize, type MemberListingFilters } from "@/lib/listing-filters";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildPageHref(basePath: string, searchParams: Record<string, string | string[] | undefined>, nextPage: number) {
  const params = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(searchParams)) {
    const value = firstValue(rawValue);
    if (!value || key === "page") continue;
    params.set(key, value);
  }
  params.set("page", String(nextPage));
  return `${basePath}?${params.toString()}`;
}

function buildSearchHref(basePath: string, searchParams: Record<string, string | string[] | undefined>, ignoredKeys: string[] = []) {
  const params = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(searchParams)) {
    const value = firstValue(rawValue);
    if (!value || ignoredKeys.includes(key)) continue;
    params.set(key, value);
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

const STATUS_LABELS: Record<Member["status"], string> = {
  new: "Novo",
  in_progress: "Em acompanhamento",
  consolidated: "Consolidado",
  inactive: "Inativo",
};

export default async function MembersPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const session = await requireServerAuthSession("coordinator");
  const accessibleTenantIds = await listAccessibleTenantIds(session);
  const page = normalizePage(firstValue(resolvedSearchParams.page), 1);
  const pageSize = normalizePageSize(firstValue(resolvedSearchParams.pageSize), 10, 50);
  const [allTenants, allCaregivers] = await Promise.all([
    listTenants({ tenantIds: accessibleTenantIds }),
    listCaregivers({ tenantIds: accessibleTenantIds }),
  ]);

  const tenants = allTenants.filter((tenant) => accessibleTenantIds.includes(tenant.id));
  const caregivers = allCaregivers.filter((caregiver) => accessibleTenantIds.includes(caregiver.tenantId));

  const filters: MemberListingFilters = {
    name: firstValue(resolvedSearchParams.name),
    city: firstValue(resolvedSearchParams.city),
    tenantId: firstValue(resolvedSearchParams.tenantId),
    caregiverId: firstValue(resolvedSearchParams.caregiverId),
    dateFrom: firstValue(resolvedSearchParams.dateFrom),
    dateTo: firstValue(resolvedSearchParams.dateTo),
    description: firstValue(resolvedSearchParams.description),
    status: (firstValue(resolvedSearchParams.status) as Member["status"] | "") ?? "",
  };

  const effectiveScope = filters.tenantId
    ? { tenantId: filters.tenantId }
    : { tenantIds: accessibleTenantIds };
  const [filteredForSummary, paginated] = await Promise.all([
    listMembers(effectiveScope).then((items) => filterMembers(items, filters)),
    listMembersPage(effectiveScope, filters, { page, pageSize }),
  ]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "0 0 32px" }}>
      <div
        style={{
          padding: "24px 16px 20px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          marginBottom: 24,
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--accent)",
            marginBottom: 6,
          }}
        >
          Coordenacao · Acolhimento
        </p>
        <h1
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "var(--text)",
            lineHeight: 1.1,
          }}
        >
          Membros
        </h1>
        <p style={{ marginTop: 8, fontSize: 14, color: "var(--text-2)", maxWidth: 640, lineHeight: 1.5 }}>
          Lista operacional dos membros acompanhados, com filtros e acoes principais fora do formulario.
        </p>
      </div>

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
          {(Object.keys(STATUS_LABELS) as Member["status"][]).map((key) => (
            <div
              key={key}
              style={{
                padding: "16px",
                borderRadius: 14,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div style={{ fontSize: 11, color: "var(--text-2)", fontWeight: 600, marginBottom: 6 }}>{STATUS_LABELS[key]}</div>
              <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1, color: "var(--text)" }}>
                {filteredForSummary.filter((member) => member.status === key).length}
              </div>
            </div>
          ))}
        </div>

        <section
          style={{
            padding: "16px",
            borderRadius: 16,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Filtros</div>
              <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>Nome, cidade, localidade, cuidador, data, descricao e status.</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link href={buildSearchHref("/api/members/export", resolvedSearchParams, ["page"])} style={secondaryLinkStyle}>
                Exportar CSV
              </Link>
              <Link
                href="/coord/membros/novo"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 42,
                  padding: "0 16px",
                  borderRadius: 12,
                  background: "var(--accent)",
                  color: "#fff",
                  textDecoration: "none",
                  fontSize: 13.5,
                  fontWeight: 700,
                }}
              >
                Novo membro
              </Link>
            </div>
          </div>

          <form method="get" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <input name="name" defaultValue={filters.name ?? ""} placeholder="Nome" style={inputStyle} />
            <input name="city" defaultValue={filters.city ?? ""} placeholder="Cidade" style={inputStyle} />
            <select name="tenantId" defaultValue={filters.tenantId ?? ""} style={inputStyle}>
              <option value="">Todas as localidades</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
            <select name="caregiverId" defaultValue={filters.caregiverId ?? ""} style={inputStyle}>
              <option value="">Todos os cuidadores</option>
              {caregivers.map((caregiver) => (
                <option key={caregiver.id} value={caregiver.id}>
                  {caregiver.name}
                </option>
              ))}
            </select>
            <select name="status" defaultValue={filters.status ?? ""} style={inputStyle}>
              <option value="">Todos os status</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <input name="dateFrom" type="date" defaultValue={filters.dateFrom ?? ""} style={inputStyle} />
            <input name="dateTo" type="date" defaultValue={filters.dateTo ?? ""} style={inputStyle} />
            <input name="description" defaultValue={filters.description ?? ""} placeholder="Descricao / observacao" style={inputStyle} />
            <input type="hidden" name="pageSize" value={String(pageSize)} />
            <div style={{ display: "flex", gap: 8, gridColumn: "1 / -1" }}>
              <button type="submit" style={primaryButtonStyle}>Aplicar filtros</button>
              <Link href="/coord/membros" style={secondaryLinkStyle}>Limpar</Link>
            </div>
          </form>
        </section>

        <MemberList members={paginated.items} tenants={tenants} caregivers={caregivers} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "var(--text-3)" }}>
            Pagina {paginated.page} de {paginated.totalPages} · {paginated.totalItems} resultado(s)
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            {paginated.page > 1 ? <Link href={buildPageHref("/coord/membros", resolvedSearchParams, paginated.page - 1)} style={secondaryLinkStyle}>Anterior</Link> : null}
            {paginated.page < paginated.totalPages ? <Link href={buildPageHref("/coord/membros", resolvedSearchParams, paginated.page + 1)} style={secondaryLinkStyle}>Proxima</Link> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle: CSSProperties = {
  height: 46,
  padding: "0 14px",
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text)",
  fontFamily: "inherit",
  fontSize: 14,
};

const primaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 42,
  padding: "0 16px",
  borderRadius: 12,
  border: 0,
  background: "var(--accent)",
  color: "#fff",
  fontFamily: "inherit",
  fontSize: 13.5,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 42,
  padding: "0 16px",
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text)",
  textDecoration: "none",
  fontSize: 13.5,
  fontWeight: 600,
};

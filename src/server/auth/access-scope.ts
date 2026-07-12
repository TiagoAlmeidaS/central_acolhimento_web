import type { AppRole, AuthSession, DataScope } from "@/server/domain/mvp";
import { listUserMemberships } from "@/server/repositories/auth-repository";

function assertTenantAccess(session: AuthSession, tenantId: string) {
  if (tenantId !== session.membership.tenantId) {
    throw new Error("Acesso negado para outro tenant.");
  }
}

function assertCaregiverOwnership(session: AuthSession, caregiverId: string | null | undefined) {
  if (session.membership.role !== "caregiver") {
    return;
  }

  if (!session.membership.caregiverId) {
    throw new Error("Sessao de cuidador sem vinculo com caregiver.");
  }

  if (caregiverId && caregiverId !== session.membership.caregiverId) {
    throw new Error("Acesso negado para outro cuidador.");
  }
}

export function getDataScopeFromSession(session: AuthSession): DataScope {
  return {
    tenantId: session.membership.tenantId,
    caregiverId: session.membership.role === "caregiver" ? session.membership.caregiverId : undefined,
  };
}

export function resolveTenantId(session: AuthSession, tenantId?: string | null) {
  if (session.membership.role === "caregiver") {
    return session.membership.tenantId;
  }

  const resolvedTenantId = tenantId ?? session.membership.tenantId;
  assertTenantAccess(session, resolvedTenantId);
  return resolvedTenantId;
}

export async function listAccessibleTenantIds(session: AuthSession) {
  if (session.membership.role === "caregiver") {
    return [session.membership.tenantId];
  }

  const memberships = await listUserMemberships(session.user.id);
  return Array.from(new Set([session.membership.tenantId, ...memberships.map((membership) => membership.tenantId)]));
}

export async function resolveTenantIdForUserAccess(session: AuthSession, tenantId?: string | null) {
  if (session.membership.role === "caregiver") {
    return session.membership.tenantId;
  }

  const resolvedTenantId = tenantId ?? session.membership.tenantId;
  const accessibleTenantIds = await listAccessibleTenantIds(session);

  if (!accessibleTenantIds.includes(resolvedTenantId)) {
    throw new Error("Acesso negado para outro tenant.");
  }

  return resolvedTenantId;
}

export function resolveCaregiverId(
  session: AuthSession,
  caregiverId?: string | null,
  options?: { allowUnassignedForCoordinator?: boolean }
) {
  if (session.membership.role === "caregiver") {
    if (!session.membership.caregiverId) {
      throw new Error("Sessao de cuidador sem vinculo com caregiver.");
    }

    return session.membership.caregiverId;
  }

  if (!caregiverId && !options?.allowUnassignedForCoordinator) {
    return null;
  }

  return caregiverId ?? null;
}

export function assertSessionCanAccessRecord(
  session: AuthSession,
  record: { tenantId: string; caregiverId?: string | null }
) {
  assertTenantAccess(session, record.tenantId);
  assertCaregiverOwnership(session, record.caregiverId);
}

export function assertSessionRole(session: AuthSession, role: AppRole) {
  if (session.membership.role !== role) {
    throw new Error("Perfil sem permissao para esta acao.");
  }
}

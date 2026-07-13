import type { AuthSession, UserProfileView } from "@/server/domain/mvp";
import {
  authenticateAppUser,
  findAppUserById,
  updateAppUserPassword,
  updateAppUserProfile,
} from "@/server/repositories/auth-repository";
import { listCaregivers } from "@/server/repositories/mvp-repository";

export async function getUserProfile(session: AuthSession): Promise<UserProfileView> {
  const appUser = await findAppUserById(session.user.id);

  if (!appUser) {
    throw new Error("Usuario autenticado nao encontrado no cadastro principal.");
  }

  const caregiver =
    session.membership.caregiverId
      ? (await listCaregivers({ tenantId: session.membership.tenantId, caregiverId: session.membership.caregiverId }))[0] ?? null
      : null;

  return {
    appUserId: appUser.id,
    firstName: appUser.firstName,
    lastName: appUser.lastName,
    fullName: `${appUser.firstName} ${appUser.lastName}`.trim(),
    email: appUser.email,
    phone: appUser.phone,
    active: appUser.active,
    tenantUserId: session.membership.tenantUserId,
    tenantId: session.membership.tenantId,
    tenantName: session.membership.tenantName,
    tenantCity: session.membership.tenantCity,
    tenantState: session.membership.tenantState,
    role: session.membership.role,
    caregiver: caregiver
      ? {
          caregiverId: caregiver.id,
          name: caregiver.name,
          phone: caregiver.phone,
          email: caregiver.email,
          active: caregiver.active,
          notes: caregiver.notes,
          activeMembers: caregiver.activeMembers ?? 0,
        }
      : null,
  };
}

export async function updateUserProfile(
  session: AuthSession,
  input: { firstName: string; lastName: string; phone: string },
): Promise<UserProfileView> {
  await updateAppUserProfile(session.user.id, input);
  return getUserProfile({
    ...session,
    user: {
      ...session.user,
      firstName: input.firstName,
      lastName: input.lastName,
    },
  });
}

export async function changeUserPassword(
  session: AuthSession,
  input: { currentPassword: string; newPassword: string },
) {
  const validated = await authenticateAppUser({
    email: session.user.email,
    password: input.currentPassword,
    tenantUserId: session.membership.tenantUserId,
  });

  if (!validated) {
    throw new Error("Senha atual invalida.");
  }

  if (input.newPassword.length < 8) {
    throw new Error("A nova senha precisa ter ao menos 8 caracteres.");
  }

  await updateAppUserPassword(session.user.id, input.newPassword);
}

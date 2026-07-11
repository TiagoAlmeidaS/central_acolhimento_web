export type TenantStatus = "active" | "inactive";
export type AppRole = "coordinator" | "caregiver";
export type MemberStatus = "new" | "in_progress" | "consolidated" | "inactive";
export type SeedStatus = "new" | "contacted" | "in_progress" | "consolidated" | "inactive";
export type FollowupType = "visit" | "call" | "message" | "prayer" | "other";
export type InvitationStatus = "pending" | "accepted" | "revoked" | "expired";
export type SignupChannelUseStatus = "submitted" | "approved" | "rejected";

export type Tenant = {
  id: string;
  name: string;
  city: string;
  state: string;
  status: TenantStatus;
  coordinator: string | null;
  createdAt?: string;
};

export type TenantUser = {
  id: string;
  tenantId: string;
  authUserId: string | null;
  appUserId?: string | null;
  name: string;
  email: string | null;
  role: AppRole;
  active: boolean;
};

export type AppUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  active: boolean;
  createdAt?: string;
};

export type Caregiver = {
  id: string;
  tenantId: string;
  tenantUserId: string | null;
  name: string;
  phone: string;
  email: string | null;
  active: boolean;
  notes: string;
  city?: string;
  activeMembers?: number;
  createdAt?: string;
};

export type Seed = {
  id: string;
  tenantId: string;
  caregiverId: string | null;
  referenceName: string;
  age: number | null;
  phone: string;
  city: string;
  postalCode: string;
  openHouse: boolean;
  address: string;
  street: string;
  neighborhood: string;
  addressNumber: string;
  state: string;
  houseFrontImageUrl: string | null;
  source: string;
  status: SeedStatus;
  notes: string;
  firstContactAt: string | null;
  caregiver?: string | null;
  createdAt?: string;
  latitude: number | null;
  longitude: number | null;
  isUrgent?: boolean;
};

export type Member = {
  id: string;
  tenantId: string;
  caregiverId: string | null;
  seedId: string | null;
  name: string;
  age: number | null;
  phone: string;
  address: string;
  postalCode: string;
  street: string;
  neighborhood: string;
  addressNumber: string;
  state: string;
  city: string;
  birthDate: string | null;
  status: MemberStatus;
  notes: string;
  caregiver?: string | null;
  lastContact?: string | null;
  createdAt?: string;
  latitude: number | null;
  longitude: number | null;
  isUrgent?: boolean;
};

export type Followup = {
  id: string;
  tenantId: string;
  memberId: string;
  caregiverId: string | null;
  type: FollowupType;
  occurredAt: string;
  notes: string;
  nextActionAt: string | null;
  member?: string | null;
  caregiver?: string | null;
  createdAt?: string;
};

export type DashboardCard = {
  label: string;
  value: string;
  detail: string;
};

export type DataScope = {
  tenantId?: string;
  caregiverId?: string | null;
};

export type CaregiverInvitation = {
  id: string;
  tenantId: string;
  role: AppRole;
  email: string | null;
  token: string;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt: string | null;
  inviteUrl: string;
  createdAt?: string;
};

export type CaregiverSignupChannel = {
  id: string;
  tenantId: string;
  role: AppRole;
  name: string;
  token: string;
  active: boolean;
  expiresAt: string | null;
  maxUses: number | null;
  usesCount: number;
  requireApproval: boolean;
  allowedEmailDomain: string | null;
  signupUrl: string;
  tenantName?: string | null;
  tenantCity?: string | null;
  tenantState?: string | null;
  createdAt?: string;
};

export type CaregiverSignupChannelUse = {
  id: string;
  channelId: string;
  tenantId: string;
  appUserId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: SignupChannelUseStatus;
  approvedAt: string | null;
  approvedByTenantUserId: string | null;
  createdAt?: string;
};

export type CreateTenantInput = {
  name: string;
  city: string;
  state: string;
  status?: TenantStatus;
  coordinator?: string | null;
};

export type UpdateTenantInput = CreateTenantInput;

export type CreateCaregiverInput = {
  tenantId: string;
  tenantUserId?: string | null;
  name: string;
  phone?: string;
  email?: string | null;
  active?: boolean;
  notes?: string;
};

export type UpdateCaregiverInput = CreateCaregiverInput;

export type CreateSeedInput = {
  tenantId: string;
  caregiverId?: string | null;
  referenceName: string;
  age?: number | null;
  phone?: string;
  city?: string;
  postalCode?: string;
  openHouse?: boolean;
  address?: string;
  street?: string;
  neighborhood?: string;
  addressNumber?: string;
  state?: string;
  houseFrontImageUrl?: string | null;
  source?: string;
  status?: SeedStatus;
  notes?: string;
  firstContactAt?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isUrgent?: boolean;
};

export type UpdateSeedInput = CreateSeedInput;

export type ConvertSeedToMemberInput = {
  caregiverId?: string | null;
  address?: string;
  age?: number | null;
  birthDate?: string | null;
  notes?: string;
  latitude?: number | null;
  longitude?: number | null;
  isUrgent?: boolean;
};

export type CreateMemberInput = {
  tenantId: string;
  caregiverId?: string | null;
  seedId?: string | null;
  name: string;
  age?: number | null;
  phone?: string;
  address?: string;
  postalCode?: string;
  street?: string;
  neighborhood?: string;
  addressNumber?: string;
  state?: string;
  city?: string;
  birthDate?: string | null;
  status?: MemberStatus;
  notes?: string;
  latitude?: number | null;
  longitude?: number | null;
  isUrgent?: boolean;
};

export type UpdateMemberInput = CreateMemberInput;

export type CreateFollowupInput = {
  tenantId: string;
  memberId: string;
  caregiverId?: string | null;
  type: FollowupType;
  occurredAt?: string;
  notes?: string;
  nextActionAt?: string | null;
};

export type UpdateFollowupInput = CreateFollowupInput;

export type CreateCaregiverInvitationInput = {
  tenantId: string;
  email?: string | null;
  expiresInDays?: number;
  createdByTenantUserId?: string | null;
  role?: AppRole;
};

export type CreateCaregiverSignupChannelInput = {
  tenantId: string;
  name: string;
  expiresInDays?: number | null;
  maxUses?: number | null;
  createdByTenantUserId?: string | null;
  role?: AppRole;
  requireApproval?: boolean;
  allowedEmailDomain?: string | null;
};

export type AcceptCaregiverInvitationInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
};

export type RegisterCaregiverSignupChannelInput = AcceptCaregiverInvitationInput;

export type LoginInput = {
  email: string;
  password: string;
  tenantUserId?: string | null;
};

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

export type UserMembership = {
  tenantUserId: string;
  tenantId: string;
  tenantName: string;
  tenantCity: string;
  tenantState: string;
  role: AppRole;
  caregiverId: string | null;
};

export type AuthSession = {
  user: AuthUser;
  membership: UserMembership;
  homePath: string;
};

export type LoginSuccessResult = {
  type: "authenticated";
  session: AuthSession;
};

export type LoginTenantSelectionResult = {
  type: "select-membership";
  user: AuthUser;
  memberships: UserMembership[];
};

export type LoginResult = LoginSuccessResult | LoginTenantSelectionResult;

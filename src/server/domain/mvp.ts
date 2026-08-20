export type TenantStatus = "active" | "inactive";
export type AppRole = "coordinator" | "caregiver";
export type MemberStatus = "new" | "in_progress" | "consolidated" | "inactive";
export type SpiritualTemperature = "cold" | "warm" | "hot";
export type SeedStatus = "new" | "contacted" | "waiting_visit" | "in_progress" | "consolidated" | "inactive";
export type FollowupType = "visit" | "call" | "message" | "prayer" | "other";
export type InvitationStatus = "pending" | "accepted" | "revoked" | "expired";
export type SignupChannelUseStatus = "submitted" | "approved" | "rejected";
export type OutingStatus = "draft" | "generated" | "confirmed" | "cancelled";
export type OutingParticipantType = "caregiver" | "member" | "guest";
export type OutingConstraintType = "must_stay_together";
export type OutingAssignmentSource = "system" | "manual";
export type DailyOutingAgeGroup = "adolescent" | "other_known" | "unknown";
export type TciSessionStatus = "draft" | "scheduled" | "confirmed" | "completed" | "cancelled";
export type ChurchMembershipStatus = "active" | "inactive";
export type ChurchRecurrenceKind = "none" | "weekly";
export type ChurchOccurrenceStatus = "scheduled" | "completed" | "cancelled";
export type ChurchAttendanceStatus = "unmarked" | "present" | "absent" | "justified";

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
  outingEventId?: string | null;
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
  spiritualTemperature?: SpiritualTemperature | null;
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

export type OutingEvent = {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  scheduledFor: string | null;
  targetGroupSize: number;
  allowGroupsWithoutCar: boolean;
  status: OutingStatus;
  outingTypeId: string | null;
  outingTypeName?: string | null;
  completedAt: string | null;
  completedByTenantUserId: string | null;
  createdByTenantUserId: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type OutingType = {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  active: boolean;
  createdByTenantUserId: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type DailyOutingReport = {
  version: "daily-outing-v1";
  generatedAt: string;
  timezone: "America/Sao_Paulo";
  date: string;
  dateTo: string;
  tenant: Pick<Tenant, "id" | "name" | "city" | "state">;
  totals: {
    completedOutings: number;
    participations: number;
    newContacts: number;
    adolescents: number;
    otherKnownAges: number;
    unknownAges: number;
    openHouses: number;
    openHousesWithoutCoordinates: number;
  };
  byType: Array<{
    outingTypeId: string | null;
    name: string;
    outings: number;
    participations: number;
    newContacts: number;
    adolescents: number;
    openHouses: number;
  }>;
  outings: Array<{
    id: string;
    name: string;
    typeName: string;
    completedAt: string;
    participationCount: number;
    newContactCount: number;
  }>;
  contacts: Array<{
    id: string;
    name: string;
    age: number | null;
    ageGroup: DailyOutingAgeGroup;
    outingId: string | null;
    outingName: string | null;
    outingTypeName: string | null;
    openHouse: boolean;
    address: string;
    city: string;
    latitude: number | null;
    longitude: number | null;
  }>;
};

export type OutingParticipant = {
  id: string;
  outingEventId: string;
  participantType: OutingParticipantType;
  participantId: string | null;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  hasCar: boolean;
  carSeats: number;
  isDriver: boolean;
  notes: string;
  createdAt?: string;
};

export type OutingConstraintGroup = {
  id: string;
  outingEventId: string;
  label: string;
  constraintType: OutingConstraintType;
  participantIds: string[];
  createdAt?: string;
};

export type OutingGroup = {
  id: string;
  outingEventId: string;
  name: string;
  driverParticipantId: string | null;
  carCapacityTotal: number | null;
  sortOrder: number;
  participants: OutingParticipant[];
  assignedBy?: OutingAssignmentSource;
  createdAt?: string;
};

export type OutingDetail = {
  outing: OutingEvent;
  participants: OutingParticipant[];
  constraints: OutingConstraintGroup[];
  groups: OutingGroup[];
};

export type TciChamber = {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  capacity: number | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type TciSessionCaregiver = {
  id: string;
  tciSessionId: string;
  caregiverId: string;
  caregiverName?: string | null;
  role: string | null;
  createdAt?: string;
};

export type TciSession = {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  scheduledDate: string;
  startsAt: string;
  endsAt: string;
  chamberId: string;
  chamberName?: string | null;
  status: TciSessionStatus;
  notes: string;
  createdByTenantUserId: string | null;
  caregivers: TciSessionCaregiver[];
  createdAt?: string;
  updatedAt?: string;
};

export type ChurchMembership = {
  id: string;
  tenantId: string;
  memberId: string;
  status: ChurchMembershipStatus;
  startedAt: string | null;
  endedAt: string | null;
  notes: string;
  createdByTenantUserId: string | null;
  memberName?: string | null;
  memberPhone?: string | null;
  memberCity?: string | null;
  caregiverName?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ChurchMeetingType = {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  color: string;
  active: boolean;
  recurrenceKind: ChurchRecurrenceKind;
  weekday: number | null;
  startsAt: string | null;
  endsAt: string | null;
  recurrenceStartsOn: string | null;
  recurrenceEndsOn: string | null;
  notes: string;
  createdByTenantUserId: string | null;
  occurrenceCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ChurchMeetingOccurrence = {
  id: string;
  tenantId: string;
  meetingTypeId: string;
  occursOn: string;
  startsAt: string | null;
  endsAt: string | null;
  status: ChurchOccurrenceStatus;
  attendanceClosedAt: string | null;
  attendanceClosedByTenantUserId: string | null;
  notes: string;
  meetingTypeName?: string | null;
  meetingTypeColor?: string | null;
  attendanceTotals?: Record<ChurchAttendanceStatus, number>;
  createdAt?: string;
  updatedAt?: string;
};

export type ChurchAttendanceRecord = {
  id: string;
  tenantId: string;
  occurrenceId: string;
  memberId: string;
  status: ChurchAttendanceStatus;
  notes: string;
  markedByTenantUserId: string | null;
  markedAt: string | null;
  memberName?: string | null;
  memberPhone?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type UserProfileView = {
  appUserId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  active: boolean;
  tenantUserId: string;
  tenantId: string;
  tenantName: string;
  tenantCity: string;
  tenantState: string;
  role: AppRole;
  caregiver: {
    caregiverId: string;
    name: string;
    phone: string;
    email: string | null;
    active: boolean;
    notes: string;
    activeMembers: number;
  } | null;
};

export type DashboardCard = {
  label: string;
  value: string;
  detail: string;
};

export type PaginatedListResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type DataScope = {
  tenantId?: string;
  tenantIds?: string[];
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
  outingEventId?: string | null;
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
  spiritualTemperature?: SpiritualTemperature | null;
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
  spiritualTemperature?: SpiritualTemperature | null;
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

export type CreateOutingInput = {
  tenantId: string;
  name: string;
  description?: string;
  scheduledFor?: string | null;
  targetGroupSize?: number;
  allowGroupsWithoutCar?: boolean;
  createdByTenantUserId?: string | null;
  outingTypeId?: string | null;
};

export type UpdateOutingInput = CreateOutingInput;

export type CreateOutingTypeInput = {
  tenantId: string;
  name: string;
  description?: string;
  active?: boolean;
  createdByTenantUserId?: string | null;
};

export type UpdateOutingTypeInput = Omit<CreateOutingTypeInput, "createdByTenantUserId">;

export type AddOutingParticipantInput = {
  outingEventId: string;
  participantType: OutingParticipantType;
  participantId?: string | null;
  displayName?: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  email?: string | null;
  hasCar?: boolean;
  carSeats?: number;
  isDriver?: boolean;
  notes?: string;
};

export type CreateOutingConstraintInput = {
  outingEventId: string;
  label: string;
  participantIds: string[];
};

export type CreateTciChamberInput = {
  tenantId: string;
  name: string;
  description?: string;
  capacity?: number | null;
  active?: boolean;
};

export type UpdateTciChamberInput = CreateTciChamberInput;

export type CreateTciSessionInput = {
  tenantId: string;
  title: string;
  description?: string;
  scheduledDate: string;
  startsAt: string;
  endsAt: string;
  chamberId: string;
  caregiverIds: string[];
  caregiverRoles?: Array<{ caregiverId: string; role?: string | null }>;
  status?: TciSessionStatus;
  notes?: string;
  createdByTenantUserId?: string | null;
};

export type UpdateTciSessionInput = CreateTciSessionInput;

export type CreateChurchMembershipInput = {
  tenantId: string;
  memberId: string;
  startedAt?: string | null;
  notes?: string;
  createdByTenantUserId?: string | null;
};

export type UpdateChurchMembershipInput = {
  status?: ChurchMembershipStatus;
  startedAt?: string | null;
  endedAt?: string | null;
  notes?: string;
};

export type CreateChurchMeetingTypeInput = {
  tenantId: string;
  name: string;
  description?: string;
  color?: string;
  active?: boolean;
  recurrenceKind?: ChurchRecurrenceKind;
  weekday?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  recurrenceStartsOn?: string | null;
  recurrenceEndsOn?: string | null;
  notes?: string;
  createdByTenantUserId?: string | null;
};

export type UpdateChurchMeetingTypeInput = CreateChurchMeetingTypeInput;

export type CreateChurchOccurrenceInput = {
  tenantId: string;
  meetingTypeId: string;
  occursOn: string;
  startsAt?: string | null;
  endsAt?: string | null;
  notes?: string;
};

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

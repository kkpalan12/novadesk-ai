import {
  MembershipRole,
  MembershipStatus,
} from "../../interfaces/membership.interface";

export interface UpdateMembershipDto {
  role?: MembershipRole;
  status?: MembershipStatus;
}

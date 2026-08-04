import { MembershipRole } from "../../interfaces/membership.interface";

export interface CreateMembershipDto {
  workspace: string;
  user: string;
  role?: MembershipRole;
}

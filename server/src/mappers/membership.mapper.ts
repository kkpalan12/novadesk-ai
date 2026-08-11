import { MembershipEntity } from "../entities/membership.entity";
import { CreateMembershipDto } from "../dto/membership/create-membership.dto";

export class MembershipMapper {
  static toEntity(dto: CreateMembershipDto): MembershipEntity {
    return new MembershipEntity({
      workspace: dto.workspace,
      user: dto.user,
      role: dto.role,
    });
  }
}

import { Role } from '@prisma/client';

export class UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

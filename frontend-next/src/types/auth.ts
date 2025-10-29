import { Role } from './common';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface LoginPayload {
  email: string;
  password: string;
}

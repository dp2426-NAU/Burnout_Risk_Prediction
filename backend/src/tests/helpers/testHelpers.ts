// Test helper for generating JWT tokens
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { IUser } from '../../models/user.model';

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

export function generateTestToken(user: IUser): string {
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role
  };
  
  const signOptions: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn']
  };
  
  return jwt.sign(payload, JWT_SECRET as Secret, signOptions);
}


// Auth service tests - Created by Balaji Koneti
import { registerUser, loginUser, verifyToken, changePassword } from '../../services/auth.service';
import { User } from '../../models/user.model';
import jwt from 'jsonwebtoken';

describe('Auth Service', () => {
  beforeEach(async () => {
    // Clear users before each test
    await User.deleteMany({});
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user' as const,
      };

      const result = await registerUser(
        userData.email,
        userData.password,
        userData.firstName,
        userData.lastName,
        userData.role
      );

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user?.email).toBe(userData.email);
      expect(result.user?.firstName).toBe(userData.firstName);
      expect(result.user?.lastName).toBe(userData.lastName);
      expect(result.user?.role).toBe(userData.role);
    });

    it('should not register user with duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user' as const,
      };

      // Register first user
      await registerUser(
        userData.email,
        userData.password,
        userData.firstName,
        userData.lastName,
        userData.role
      );

      // Try to register with same email
      const result = await registerUser(
        userData.email,
        'differentpassword',
        'Jane',
        'Smith',
        'user'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('already exists');
    });

    it('should hash password before storing', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user' as const,
      };

      await registerUser(
        userData.email,
        userData.password,
        userData.firstName,
        userData.lastName,
        userData.role
      );

      const user = await User.findOne({ email: userData.email }).select('+password');
      expect(user?.password).not.toBe(userData.password);
      expect(user?.password).toMatch(/^\$2[aby]\$/); // bcrypt hash format
    });
  });

  describe('loginUser', () => {
    beforeEach(async () => {
      // Create a test user
      await registerUser(
        'test@example.com',
        'password123',
        'John',
        'Doe',
        'user'
      );
    });

    it('should login with valid credentials', async () => {
      const result = await loginUser('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user?.email).toBe('test@example.com');
    });

    it('should not login with invalid email', async () => {
      const result = await loginUser('nonexistent@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid email or password');
    });

    it('should not login with invalid password', async () => {
      const result = await loginUser('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid email or password');
    });

    it('should update lastLogin on successful login', async () => {
      const result = await loginUser('test@example.com', 'password123');
      
      expect(result.success).toBe(true);
      expect(result.user?.lastLogin).toBeDefined();
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      // Create a test user
      const registerResult = await registerUser(
        'test@example.com',
        'password123',
        'John',
        'Doe',
        'user'
      );

      const payload = verifyToken(registerResult.token!);

      expect(payload).not.toBeNull();
      expect(payload?.email).toBe('test@example.com');
    });

    it('should reject invalid token', async () => {
      const payload = verifyToken('invalid-token');

      expect(payload).toBeNull();
    });

    it('should reject expired token', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { userId: 'test-id', email: 'test@example.com' },
        process.env.JWT_SECRET!,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const payload = verifyToken(expiredToken);

      expect(payload).toBeNull();
    });
  });

  describe('changePassword', () => {
    let userId: string;
    let token: string;

    beforeEach(async () => {
      const result = await registerUser(
        'test@example.com',
        'password123',
        'John',
        'Doe',
        'user'
      );
      userId = result.user!._id.toString();
      token = result.token!;
    });

    it('should change password with valid current password', async () => {
      const result = await changePassword(
        userId,
        'password123',
        'newpassword123'
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('Password changed successfully');

      // Verify new password works
      const loginResult = await loginUser('test@example.com', 'newpassword123');
      expect(loginResult.success).toBe(true);
    });

    it('should not change password with invalid current password', async () => {
      const result = await changePassword(
        userId,
        'wrongpassword',
        'newpassword123'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Current password is incorrect');
    });

    it('should not change password for non-existent user', async () => {
      const result = await changePassword(
        '507f1f77bcf86cd799439011', // Valid ObjectId but non-existent
        'password123',
        'newpassword123'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('User not found');
    });
  });
});

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = require("../../services/auth.service");
const user_model_1 = require("../../models/user.model");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
describe('Auth Service', () => {
    beforeEach(async () => {
        await user_model_1.User.deleteMany({});
    });
    describe('registerUser', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe',
                role: 'user',
            };
            const result = await (0, auth_service_1.registerUser)(userData.email, userData.password, userData.firstName, userData.lastName, userData.role);
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
                role: 'user',
            };
            await (0, auth_service_1.registerUser)(userData.email, userData.password, userData.firstName, userData.lastName, userData.role);
            const result = await (0, auth_service_1.registerUser)(userData.email, 'differentpassword', 'Jane', 'Smith', 'user');
            expect(result.success).toBe(false);
            expect(result.message).toContain('already exists');
        });
        it('should hash password before storing', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe',
                role: 'user',
            };
            await (0, auth_service_1.registerUser)(userData.email, userData.password, userData.firstName, userData.lastName, userData.role);
            const user = await user_model_1.User.findOne({ email: userData.email });
            expect(user?.password).not.toBe(userData.password);
            expect(user?.password).toMatch(/^\$2[aby]\$/);
        });
    });
    describe('loginUser', () => {
        beforeEach(async () => {
            await (0, auth_service_1.registerUser)('test@example.com', 'password123', 'John', 'Doe', 'user');
        });
        it('should login with valid credentials', async () => {
            const result = await (0, auth_service_1.loginUser)('test@example.com', 'password123');
            expect(result.success).toBe(true);
            expect(result.user).toBeDefined();
            expect(result.token).toBeDefined();
            expect(result.user?.email).toBe('test@example.com');
        });
        it('should not login with invalid email', async () => {
            const result = await (0, auth_service_1.loginUser)('nonexistent@example.com', 'password123');
            expect(result.success).toBe(false);
            expect(result.message).toContain('Invalid email or password');
        });
        it('should not login with invalid password', async () => {
            const result = await (0, auth_service_1.loginUser)('test@example.com', 'wrongpassword');
            expect(result.success).toBe(false);
            expect(result.message).toContain('Invalid email or password');
        });
        it('should update lastLogin on successful login', async () => {
            const result = await (0, auth_service_1.loginUser)('test@example.com', 'password123');
            expect(result.success).toBe(true);
            expect(result.user?.lastLogin).toBeDefined();
        });
    });
    describe('verifyToken', () => {
        it('should verify valid token', async () => {
            const registerResult = await (0, auth_service_1.registerUser)('test@example.com', 'password123', 'John', 'Doe', 'user');
            const result = await (0, auth_service_1.verifyToken)(registerResult.token);
            expect(result.success).toBe(true);
            expect(result.user).toBeDefined();
            expect(result.user?.email).toBe('test@example.com');
        });
        it('should reject invalid token', async () => {
            const result = await (0, auth_service_1.verifyToken)('invalid-token');
            expect(result.success).toBe(false);
            expect(result.message).toContain('Invalid token');
        });
        it('should reject expired token', async () => {
            const expiredToken = jsonwebtoken_1.default.sign({ userId: 'test-id', email: 'test@example.com' }, process.env.JWT_SECRET, { expiresIn: '-1h' });
            const result = await (0, auth_service_1.verifyToken)(expiredToken);
            expect(result.success).toBe(false);
            expect(result.message).toContain('Invalid token');
        });
    });
    describe('changePassword', () => {
        let userId;
        let token;
        beforeEach(async () => {
            const result = await (0, auth_service_1.registerUser)('test@example.com', 'password123', 'John', 'Doe', 'user');
            userId = result.user._id.toString();
            token = result.token;
        });
        it('should change password with valid current password', async () => {
            const result = await (0, auth_service_1.changePassword)(userId, 'password123', 'newpassword123');
            expect(result.success).toBe(true);
            expect(result.message).toContain('Password changed successfully');
            const loginResult = await (0, auth_service_1.loginUser)('test@example.com', 'newpassword123');
            expect(loginResult.success).toBe(true);
        });
        it('should not change password with invalid current password', async () => {
            const result = await (0, auth_service_1.changePassword)(userId, 'wrongpassword', 'newpassword123');
            expect(result.success).toBe(false);
            expect(result.message).toContain('Current password is incorrect');
        });
        it('should not change password for non-existent user', async () => {
            const result = await (0, auth_service_1.changePassword)('507f1f77bcf86cd799439011', 'password123', 'newpassword123');
            expect(result.success).toBe(false);
            expect(result.message).toContain('User not found');
        });
    });
});
//# sourceMappingURL=auth.service.test.js.map
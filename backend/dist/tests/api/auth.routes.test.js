"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const auth_routes_1 = __importDefault(require("../../api/routes/auth.routes"));
const user_model_1 = require("../../models/user.model");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/auth', auth_routes_1.default);
describe('Auth Routes', () => {
    beforeEach(async () => {
        await user_model_1.User.deleteMany({});
    });
    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe',
                role: 'user',
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User registered successfully');
            expect(response.body.data.user.email).toBe(userData.email);
            expect(response.body.data.user.firstName).toBe(userData.firstName);
            expect(response.body.data.user.lastName).toBe(userData.lastName);
            expect(response.body.data.token).toBeDefined();
            expect(response.body.data.user.password).toBeUndefined();
        });
        it('should return 400 for invalid email', async () => {
            const userData = {
                email: 'invalid-email',
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe',
                role: 'user',
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation failed');
            expect(response.body.errors).toBeDefined();
        });
        it('should return 400 for short password', async () => {
            const userData = {
                email: 'test@example.com',
                password: '123',
                firstName: 'John',
                lastName: 'Doe',
                role: 'user',
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation failed');
        });
        it('should return 400 for duplicate email', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe',
                role: 'user',
            };
            await (0, supertest_1.default)(app).post('/api/auth/register').send(userData);
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('already exists');
        });
        it('should return 400 for missing required fields', async () => {
            const userData = {
                email: 'test@example.com',
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation failed');
        });
    });
    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            await (0, supertest_1.default)(app).post('/api/auth/register').send({
                email: 'test@example.com',
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe',
                role: 'user',
            });
        });
        it('should login with valid credentials', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'password123',
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Login successful');
            expect(response.body.data.user.email).toBe(loginData.email);
            expect(response.body.data.token).toBeDefined();
            expect(response.body.data.user.password).toBeUndefined();
        });
        it('should return 401 for invalid email', async () => {
            const loginData = {
                email: 'nonexistent@example.com',
                password: 'password123',
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Invalid email or password');
        });
        it('should return 401 for invalid password', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'wrongpassword',
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Invalid email or password');
        });
        it('should return 400 for invalid email format', async () => {
            const loginData = {
                email: 'invalid-email',
                password: 'password123',
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation failed');
        });
        it('should return 400 for missing password', async () => {
            const loginData = {
                email: 'test@example.com',
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation failed');
        });
    });
    describe('GET /api/auth/profile', () => {
        let authToken;
        beforeEach(async () => {
            await (0, supertest_1.default)(app).post('/api/auth/register').send({
                email: 'test@example.com',
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe',
                role: 'user',
            });
            const loginResponse = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send({
                email: 'test@example.com',
                password: 'password123',
            });
            authToken = loginResponse.body.data.token;
        });
        it('should get user profile with valid token', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe('test@example.com');
            expect(response.body.data.user.firstName).toBe('John');
            expect(response.body.data.user.lastName).toBe('Doe');
            expect(response.body.data.user.password).toBeUndefined();
        });
        it('should return 401 for invalid token', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/auth/profile')
                .set('Authorization', 'Bearer invalid-token')
                .expect(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Invalid');
        });
        it('should return 401 for missing token', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/auth/profile')
                .expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Access token required');
        });
    });
    describe('PUT /api/auth/profile', () => {
        let authToken;
        beforeEach(async () => {
            await (0, supertest_1.default)(app).post('/api/auth/register').send({
                email: 'test@example.com',
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe',
                role: 'user',
            });
            const loginResponse = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send({
                email: 'test@example.com',
                password: 'password123',
            });
            authToken = loginResponse.body.data.token;
        });
        it('should update user profile with valid data', async () => {
            const updateData = {
                firstName: 'Jane',
                lastName: 'Smith',
            };
            const response = await (0, supertest_1.default)(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.firstName).toBe('Jane');
            expect(response.body.data.user.lastName).toBe('Smith');
            expect(response.body.data.user.email).toBe('test@example.com');
        });
        it('should return 400 for invalid email format', async () => {
            const updateData = {
                email: 'invalid-email',
            };
            const response = await (0, supertest_1.default)(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation failed');
        });
        it('should return 401 for invalid token', async () => {
            const updateData = {
                firstName: 'Jane',
            };
            const response = await (0, supertest_1.default)(app)
                .put('/api/auth/profile')
                .set('Authorization', 'Bearer invalid-token')
                .send(updateData)
                .expect(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Invalid');
        });
    });
});
//# sourceMappingURL=auth.routes.test.js.map
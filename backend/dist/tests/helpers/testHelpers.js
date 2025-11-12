"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTestToken = generateTestToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
function generateTestToken(user) {
    const payload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role
    };
    const signOptions = {
        expiresIn: JWT_EXPIRES_IN
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, signOptions);
}
//# sourceMappingURL=testHelpers.js.map
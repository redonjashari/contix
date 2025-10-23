import prisma from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/password.util.js';
import { signAccessToken, signRefreshToken } from '../utils/jwt.util.js';


export const AuthService = {
async register(email: string, password: string, name: string) {
const existing = await prisma.user.findUnique({ where: { email } });
if (existing) throw new Error('Email already in use');
const passwordHash = await hashPassword(password);
const user = await prisma.user.create({ data: { email, passwordHash, name } });
const accessToken = signAccessToken({ sub: user.id, email: user.email });
const refreshToken = signRefreshToken({ sub: user.id });
return { user, accessToken, refreshToken };
},


async login(email: string, password: string) {
const user = await prisma.user.findUnique({ where: { email } });
if (!user) throw new Error('Invalid credentials');
const ok = await comparePassword(password, user.passwordHash);
if (!ok) throw new Error('Invalid credentials');
const accessToken = signAccessToken({ sub: user.id, email: user.email });
const refreshToken = signRefreshToken({ sub: user.id });
return { user, accessToken, refreshToken };
},


async refreshTokens(refreshToken: string) {
// jwt.util should verify and return payload
const payload = await import('../utils/jwt.util.js').then(mod => mod.verifyRefreshToken(refreshToken));
const user = await prisma.user.findUnique({ where: { id: payload.sub } });
if (!user) throw new Error('User not found');
const accessToken = signAccessToken({ sub: user.id, email: user.email });
const newRefreshToken = signRefreshToken({ sub: user.id });
return { accessToken, refreshToken: newRefreshToken };
},
};
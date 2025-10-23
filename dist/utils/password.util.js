// src/utils/password.util.ts
// Uses bcrypt for password hashing/comparison.
// Make sure to `npm i bcrypt` (or optional: bcryptjs if you prefer).
// Set BCRYPT_SALT_ROUNDS in .env if you want a value other than 10.
import bcrypt from 'bcrypt';
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
export async function hashPassword(plain) {
    return bcrypt.hash(plain, SALT_ROUNDS);
}
export async function comparePassword(plain, hash) {
    return bcrypt.compare(plain, hash);
}

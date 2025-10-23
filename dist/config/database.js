import { PrismaClient } from '@prisma/client';
export const prisma = (() => {
    if (process.env.NODE_ENV === 'development') {
        if (!global.prisma) {
            global.prisma = new PrismaClient();
        }
        return global.prisma;
    }
    return new PrismaClient();
})();
export default prisma;

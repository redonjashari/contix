import { PrismaClient } from '@prisma/client';


declare global {
// allow global prisma across hot-reloads in dev
// eslint-disable-next-line no-var
var prisma: PrismaClient | undefined;
}


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
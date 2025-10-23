import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export async function getCurrentUser(request, reply) {
    try {
        const userId = request.user.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isVerified: true,
                createdAt: true,
            },
        });
        if (!user) {
            return reply.code(404).send({ error: 'User not found' });
        }
        reply.send(user);
    }
    catch (err) {
        reply.code(500).send({ error: err.message });
    }
}
export async function updateCurrentUser(request, reply) {
    try {
        const userId = request.user.userId;
        const { name, email } = request.body;
        const updateData = {};
        if (name)
            updateData.name = name;
        if (email)
            updateData.email = email;
        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isVerified: true,
            },
        });
        reply.send(user);
    }
    catch (err) {
        reply.code(400).send({ error: err.message });
    }
}

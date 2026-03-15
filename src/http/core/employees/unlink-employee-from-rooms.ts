import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { NotFoundError } from '@/http/@errors/not-found'
import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function unlinkEmployeeFromRooms(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/unlink-from-rooms',
      {
        schema: {
          tags: ['employees'],
          summary: 'Desvincula um funcionário de uma sala ou de várias salas',
          security: [{ bearerAuth: [] }],
          body: z.object({
            employeeId: z.cuid(),
            roomIds: z.array(z.cuid()).nonempty('Informe pelo menos uma sala.'),
          }),
          response: {
            200: z.null().describe('Funcionário desvinculado das salas com sucesso'),
          },
        },
      },
      async (request, reply) => {
        await request.checkIfEmployeeIsAdmin()

        const { employeeId, roomIds } = request.body

        const [employee, existingLinks] = await Promise.all([
          prisma.employees.findUnique({ where: { id: employeeId }, select: { id: true } }),
          prisma.employeesRooms.findMany({
            where: {
              employeeId,
              roomId: {
                in: roomIds,
              },
            },
            select: { roomId: true },
          }),
        ])

        if (!employee) {
          throw new NotFoundError('Funcionário não encontrado.')
        }

        if (existingLinks.length === 0) {
          throw new NotFoundError('Nenhum vínculo encontrado entre o funcionário e a(s) sala(s) informada(s).')
        }

        // Extrair os IDs das salas com vínculos existentes
        const roomIdsToUnlink = existingLinks.map(link => link.roomId)

        await prisma.employeesRooms.deleteMany({
          where: {
            employeeId,
            roomId: {
              in: roomIdsToUnlink,
            },
          },
        })

        return reply.status(200).send(null)
      }
    )
}

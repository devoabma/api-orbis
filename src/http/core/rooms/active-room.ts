import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '@/http/@errors/bad-request'
import { NotFoundError } from '@/http/@errors/not-found'
import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function activeRoom(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .patch(
      '/active/:id',
      {
        schema: {
          tags: ['rooms'],
          summary: 'Ativa uma sala',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.cuid(),
          }),
          response: {
            200: z.null().describe('Sala ativada com sucesso.'),
          },
        },
      },
      async (request, reply) => {
        await request.checkIfEmployeeIsAdmin()

        const { id } = request.params

        const room = await prisma.rooms.findUnique({
          where: { id },
          select: {
            id: true,
            inactive: true,
          },
        })

        if (!room) {
          throw new NotFoundError('Sala não encontrada.')
        }

        if (!room.inactive) {
          throw new BadRequestError('Sala já está ativa.')
        }

        await prisma.rooms.update({
          where: { id },
          data: {
            inactive: null,
          },
        })

        return reply.status(200).send(null)
      }
    )
}

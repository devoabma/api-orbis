import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '@/http/@errors/bad-request'
import { NotFoundError } from '@/http/@errors/not-found'
import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function inactiveRoom(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .patch(
      '/inactive/:id',
      {
        schema: {
          tags: ['rooms'],
          summary: 'Inativa uma sala',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.cuid(),
          }),
          response: {
            200: z.null(),
          },
        },
      },
      async (request, reply) => {
        await request.checkIfEmployeeIsAdmin()

        const { id } = request.params

        const room = await prisma.rooms.findUnique({
          where: { id },
        })

        if (!room) {
          throw new NotFoundError('Sala não encontrada.')
        }

        if (room.inactive !== null) {
          throw new BadRequestError('Sala já está inativa.')
        }

        await prisma.rooms.update({
          where: { id },
          data: {
            inactive: new Date(),
            updatedAt: new Date(),
          },
        })

        return reply.status(200).send()
      }
    )
}

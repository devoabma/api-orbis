import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '@/http/@errors/bad-request'
import { NotFoundError } from '@/http/@errors/not-found'
import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function placedMaintenance(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .patch(
      '/maintenance/:id',
      {
        schema: {
          tags: ['computers'],
          summary: 'Coloca um computador em manutenção',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.cuid(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        await request.getCurrentEmployeeId()

        const { id } = request.params

        const computer = await prisma.computers.findUnique({
          where: { id },
        })

        if (!computer) {
          throw new NotFoundError('Computador não encontrado.')
        }

        if (computer.maintenance) {
          throw new BadRequestError('Computador já esta em manutenção.')
        }

        await prisma.computers.update({
          where: { id },
          data: {
            maintenance: new Date(),
            updatedAt: new Date(),
          },
        })

        return reply.status(204).send()
      }
    )
}

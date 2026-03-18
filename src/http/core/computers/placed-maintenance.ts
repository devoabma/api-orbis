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
            204: z.null().describe('Computador colocado em manutenção com sucesso.'),
          },
        },
      },
      async (request, reply) => {
        await request.getCurrentEmployeeId()

        const { id } = request.params

        const computer = await prisma.computers.findUnique({
          where: { id },
          select: {
            id: true,
            maintenance: true,
            room: {
              select: {
                inactive: true,
              },
            },
          },
        })

        if (!computer) {
          throw new NotFoundError('Computador não encontrado.')
        }

        if (computer.room.inactive) {
          throw new BadRequestError('Não é possível alterar o estado de manutenção de computadores em uma sala inativa.')
        }

        if (computer.maintenance) {
          throw new BadRequestError('Computador já esta em manutenção.')
        }

        try {
          await prisma.computers.update({
            where: { id },
            data: {
              maintenance: new Date(),
            },
          })

          return reply.status(204).send(null)
        } catch (err) {
          request.log.error({ err }, 'Erro ao colocar computador em manutenção')
          throw err
        }
      }
    )
}

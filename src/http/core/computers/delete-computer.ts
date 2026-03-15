import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { NotFoundError } from '@/http/@errors/not-found'

export async function deleteComputer(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/delete/:id',
      {
        schema: {
          tags: ['computers'],
          summary: 'Deleta um computador com base no ID',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.cuid(),
          }),
          response: {
            204: z.null(),
          }
        },
      },
      async (request, reply) => {
        await request.checkIfEmployeeIsAdmin()

        const { id } = request.params

        const computer = await prisma.computers.findUnique({
          where: { id },
        })

        if (!computer) {
          throw new NotFoundError('Computador não encontrado.')
        }

        await prisma.computers.delete({
          where: { id },
        })

        return reply.status(204).send()
      }
    )
}

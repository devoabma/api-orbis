import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '@/http/@errors/bad-request'
import { NotFoundError } from '@/http/@errors/not-found'
import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function activeEmployee(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .patch(
      '/active/:id',
      {
        schema: {
          tags: ['employees'],
          summary: 'Ativa um funcionário',
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

        const employee = await prisma.employees.findUnique({
          where: { id },
        })

        if (!employee) {
          throw new NotFoundError('Funcionário não encontrado.')
        }

        if (!employee.inactive) {
          throw new BadRequestError('Funcionário já está ativo.')
        }

        await prisma.employees.update({
          where: { id },
          data: {
            inactive: null,
          },
        })

        return reply.status(200).send()
      }
    )
}

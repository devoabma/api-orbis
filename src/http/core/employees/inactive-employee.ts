import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '@/http/@errors/bad-request'
import { NotFoundError } from '@/http/@errors/not-found'
import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function inactiveEmployee(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .patch(
      '/inactive/:id',
      {
        schema: {
          tags: ['employees'],
          summary: 'Inativa um funcionário',
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
        await request.checkIfEmployeeIsAdmin()

        const { id } = request.params

        const employee = await prisma.employees.findUnique({
          where: { id },
        })

        if (!employee) {
          throw new NotFoundError('Funcionário não encontrado.')
        }

        if (employee.inactive !== null) {
          throw new BadRequestError('Funcionário já está inativo.')
        }

        await prisma.employees.update({
          where: { id },
          data: {
            inactive: new Date(),
            updatedAt: new Date(),
          },
        })

        return reply.status(204).send()
      }
    )
}

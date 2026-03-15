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
            200: z.null().describe('Funcionário inativado com sucesso'),
          },
        },
      },
      async (request, reply) => {
        await request.checkIfEmployeeIsAdmin()

        const { id } = request.params

        const employee = await prisma.employees.findUnique({
          where: { id },
          select: { inactive: true },
        })

        if (!employee) {
          throw new NotFoundError('Funcionário não encontrado.')
        }

        if (employee.inactive) {
          throw new BadRequestError('Funcionário já está inativo.')
        }

        const currentEmployeeId = await request.getCurrentEmployeeId()

        if (id === currentEmployeeId) {
          throw new BadRequestError('Não é possível inativar a si mesmo.')
        }

        await prisma.employees.update({
          where: { id },
          data: { inactive: new Date() },
        })

        return reply.status(200).send(null)
      }
    )
}

import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '@/http/@errors/bad-request'
import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function getProfile(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/profile',
      {
        schema: {
          tags: ['employees'],
          summary: 'Retorna o perfil do usuário logado',
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              employee: z.object({
                id: z.cuid(),
                name: z.string(),
                cpf: z.string(),
                email: z.email(),
                avatarUrl: z.url().nullable(),
                role: z.enum(['ADMIN', 'USER']),
              }),
            }),
          },
        },
      },
      async (request, reply) => {
        const employeeId = await request.getCurrentEmployeeId()

        const employee = await prisma.employees.findUnique({
          where: {
            id: employeeId,
          },
          select: {
            id: true,
            name: true,
            cpf: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        })

        if (!employee) {
          throw new BadRequestError('Funcionário não encontrado.')
        }

        return reply.status(200).send({ employee })
      }
    )
}

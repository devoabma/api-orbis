import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '@/http/@errors/bad-request'
import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function getAll(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/get-all',
      {
        schema: {
          tags: ['employees'],
          summary: 'Retorna todos os funcionários',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            pageIndex: z.coerce.number().default(1),
            name: z.string().optional(),
            cpf: z.string().optional(),
            role: z.enum(['ADMIN', 'USER']).optional(),
          }),
          response: {
            200: z.object({
              employees: z.array(
                z.object({
                  id: z.cuid(),
                  name: z.string(),
                  cpf: z.string(),
                  email: z.email(),
                  avatarUrl: z.url().nullable(),
                  role: z.enum(['ADMIN', 'USER']),
                  inactive: z.date().nullable(),
                })
              ),
              totalOfEmployees: z.number(),
            }),
          },
        },
      },
      async (request, reply) => {
        await request.checkIfEmployeeIsAdmin()

        const { pageIndex, name, cpf, role } = request.query

        try {
          const [employees, totalOfEmployees] = await prisma.$transaction([
            prisma.employees.findMany({
              where: {
                name: name ? { contains: name, mode: 'insensitive' } : undefined,
                cpf: cpf ? cpf : undefined,
                role: role ? role : undefined,
              },
              select: {
                id: true,
                name: true,
                cpf: true,
                email: true,
                avatarUrl: true,
                role: true,
                inactive: true,
              },
              orderBy: { name: 'desc' }, // Ordem decrescente que significa que os mais recentes vem primeiro
              skip: (pageIndex - 1) * 10,
              take: 10,
            }),
            prisma.employees.count({
              where: {
                name: name ? { contains: name, mode: 'insensitive' } : undefined,
                cpf: cpf ? cpf : undefined,
                role: role ? role : undefined,
              },
            }),
          ])

          if (!employees) {
            throw new Error('Nenhum funcionário encontrado')
          }

          return reply.status(200).send({
            employees,
            totalOfEmployees,
          })
        } catch {
          throw new BadRequestError('Não foi possível encontrar os funcionários')
        }
      }
    )
}

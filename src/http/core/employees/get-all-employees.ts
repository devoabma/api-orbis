import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '@/http/@errors/bad-request'
import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function getAllEmployees(app: FastifyInstance) {
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
                  employeesRooms: z.array(
                    z.object({
                      id: z.cuid(),
                      createdAt: z.date(),
                      rooms: z.object({
                        id: z.cuid(),
                        name: z.string(),
                        description: z.string().nullable(),
                      }),
                    })
                  ),
                })
              ),
              totalOfEmployees: z.number(),
              totalPages: z.number(),
            }),
          },
        },
      },
      async (request, reply) => {
        await request.checkIfEmployeeIsAdmin()

        const { pageIndex, name, cpf, role } = request.query

        const PER_PAGE = 10

        try {
          const where = {
            name: { contains: name, mode: 'insensitive' as const },
            cpf,
            role,
          }

          const [employees, totalOfEmployees] = await prisma.$transaction([
            prisma.employees.findMany({
              where, // aqui vai ser dinamico
              select: {
                id: true,
                name: true,
                cpf: true,
                email: true,
                avatarUrl: true,
                role: true,
                inactive: true,
                employeesRooms: {
                  select: {
                    id: true,
                    createdAt: true,
                    rooms: {
                      select: { id: true, name: true, description: true },
                    },
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
              skip: (pageIndex - 1) * PER_PAGE,
              take: PER_PAGE,
            }),
            prisma.employees.count({ where }),
          ])

          return reply.status(200).send({
            employees,
            totalOfEmployees,
            totalPages: Math.ceil(totalOfEmployees / PER_PAGE),
          })
        } catch (err) {
          request.log.error({ err }, 'Erro ao buscar funcionários')
          throw new BadRequestError('Erro ao buscar funcionários. Tente novamente mais tarde.')
        }
      }
    )
}

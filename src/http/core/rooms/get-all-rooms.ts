import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '@/http/@errors/bad-request'
import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function getAllRooms(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/get-all',
      {
        schema: {
          tags: ['rooms'],
          summary: 'Retorna todas as salas',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            pageIndex: z.coerce.number().default(1),
            name: z.string().optional(),
          }),
          response: {
            200: z.object({
              rooms: z.array(
                z.object({
                  id: z.cuid(),
                  name: z.string(),
                  standardTime: z.number(),
                  description: z.string().nullable(),
                  inactive: z.date().nullable(),
                  employeesRooms: z.array(
                    z.object({
                      id: z.cuid(),
                      createdAt: z.date(),
                      employees: z.object({
                        id: z.cuid(),
                        name: z.string(),
                        cpf: z.string(),
                        email: z.email(),
                        avatarUrl: z.url().nullable(),
                      }),
                    })
                  ),
                  computers: z.array(
                    z.object({
                      id: z.cuid(),
                      mac_code: z.string(),
                      number: z.number(),
                      description: z.string().nullable(),
                      createdAt: z.date(),
                    })
                  ),
                })
              ),
              totalOfRooms: z.number(),
              totalPages: z.number(),
            }),
          },
        },
      },
      async (request, reply) => {
        await request.checkIfEmployeeIsAdmin()

        const { pageIndex, name } = request.query

        const PER_PAGE = 10

        try {
          const where = {
            name: { contains: name, mode: 'insensitive' as const },
          }

          const [rooms, totalOfRooms] = await prisma.$transaction([
            prisma.rooms.findMany({
              where,
              select: {
                id: true,
                name: true,
                standardTime: true,
                description: true,
                inactive: true,
                employeesRooms: {
                  select: {
                    id: true,
                    createdAt: true,
                    employees: {
                      select: {
                        id: true,
                        name: true,
                        cpf: true,
                        email: true,
                        avatarUrl: true,
                      },
                    },
                  },
                },
                computers: {
                  select: {
                    id: true,
                    mac_code: true,
                    number: true,
                    description: true,
                    createdAt: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
              skip: (pageIndex - 1) * PER_PAGE,
              take: PER_PAGE,
            }),
            prisma.rooms.count({
              where,
            }),
          ])

          return reply.status(200).send({
            rooms,
            totalOfRooms,
            totalPages: Math.ceil(totalOfRooms / PER_PAGE),
          })
        } catch (err) {
          request.log.error({ err }, 'Erro ao buscar salas')
          throw new BadRequestError('Erro ao buscar salas. Tente novamente mais tarde.')
        }
      }
    )
}

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

        try {
          const [rooms, totalOfRooms] = await prisma.$transaction([
            prisma.rooms.findMany({
              where: {
                name: { contains: name, mode: 'insensitive' },
              },
              select: {
                id: true,
                name: true,
                inactive: true,
                employeesRooms: {
                  include: {
                    employees: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
              skip: (pageIndex - 1) * 10,
              take: 10,
            }),
            prisma.employees.count({
              where: {
                name: { contains: name, mode: 'insensitive' },
              },
            }),
          ])

          return reply.status(200).send({
            rooms,
            totalOfRooms,
            totalPages: Math.ceil(totalOfRooms / 10),
          })
        } catch (err) {
          console.error('Erro ao buscar salas:', err)
          throw new BadRequestError('Erro ao buscar salas. Tente novamente mais tarde.')
        }
      }
    )
}

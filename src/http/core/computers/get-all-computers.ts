import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { Prisma } from '@/generated/prisma'
import { BadRequestError } from '@/http/@errors/bad-request'
import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function getAllComputers(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/get-all/:roomId?',
      {
        schema: {
          tags: ['computers'],
          summary: 'Retorna todos os computadores ou por sala',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            pageIndex: z.coerce.number().default(1),
            description: z.string().optional(),
          }),
          params: z.object({
            roomId: z.cuid().optional(),
          }),
          response: {
            200: z.object({
              computers: z.array(
                z.object({
                  id: z.cuid(),
                  mac_code: z.string(),
                  number: z.number().int().positive(),
                  description: z.string().nullable(),
                  inUse: z.boolean(),
                  currentLawyerId: z.string().nullable(),
                  maintenance: z.date().nullable(),
                  room: z
                    .object({
                      id: z.cuid(),
                      name: z.string(),
                      standardTime: z.number(),
                      description: z.string().nullable(),
                      inactive: z.date().nullable(),
                    })
                    .nullable(),
                })
              ),
              totalOfComputers: z.number(),
              totalPages: z.number(),
            }),
          },
        },
      },
      async (request, reply) => {
        await request.checkIfEmployeeIsAdmin()

        const { pageIndex, description } = request.query
        const { roomId } = request.params

        const PER_PAGE = 10

        try {
          const where: Prisma.ComputersWhereInput = {
            description: description ? { contains: description.trim(), mode: 'insensitive' } : undefined,
            roomId: roomId ?? undefined,
          }
          const [computers, totalOfComputers] = await prisma.$transaction([
            prisma.computers.findMany({
              where,
              select: {
                id: true,
                mac_code: true,
                number: true,
                description: true,
                maintenance: true,
                inUse: true,
                currentLawyerId: true,
                room: {
                  select: {
                    id: true,
                    name: true,
                    standardTime: true,
                    description: true,
                    inactive: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
              skip: (pageIndex - 1) * PER_PAGE,
              take: PER_PAGE,
            }),
            prisma.computers.count({ where }),
          ])

          return reply.status(200).send({
            computers,
            totalOfComputers,
            totalPages: Math.ceil(totalOfComputers / PER_PAGE),
          })
        } catch (err) {
          request.log.error({ err }, 'Erro ao buscar computadores. Tente novamente mais tarde.')
          throw new BadRequestError('Erro ao buscar computadores. Tente novamente mais tarde.')
        }
      }
    )
}

import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '@/http/@errors/bad-request'
import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { normalizeRoomName } from '@/utils/app/room-utils'

export async function createRoom(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/create',
      {
        schema: {
          tags: ['rooms'],
          summary: 'Criação de uma nova sala',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string().trim().nonempty(),
            standardTime: z.number().int().positive().optional(),
            description: z.string().optional(),
          }),
          response: {
            201: z.object({
              roomId: z.object({
                id: z.cuid(),
              }),
            }),
          },
        },
      },
      async (request, reply) => {
        // somente administradores podem criar novas salas
        await request.checkIfEmployeeIsAdmin()

        const { name, standardTime, description } = request.body

        // Crie a versão normalizada do nome usando o utilitário
        const normalizedName = normalizeRoomName(name)

        const roomAlreadyExists = await prisma.rooms.findUnique({
          where: {
            normalizedName,
          },
          select: {
            id: true,
            normalizedName: true,
          },
        })

        if (roomAlreadyExists) {
          throw new BadRequestError('Já existe uma sala com um nome muito parecido ou idêntico.')
        }

        const nameUpperCase = name.toUpperCase()

        console.log(nameUpperCase)

        try {
          const room = await prisma.rooms.create({
            data: {
              name: nameUpperCase,
              normalizedName,
              standardTime,
              description,
            },
          })

          return reply.status(201).send({
            roomId: {
              id: room.id,
            },
          })
        } catch (err) {
          // Caso ocorra uma violação de unicidade concorrente (race condition)
          if (err instanceof Error && 'code' in err && err.code === 'P2002') {
            throw new BadRequestError('Já existe uma sala com um nome muito parecido ou idêntico.')
          }

          console.error('Não foi possível criar a sala.', err)
          throw new BadRequestError('Não foi possível realizar a criação da sala.')
        }
      }
    )
}

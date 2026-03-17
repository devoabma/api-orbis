import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '@/http/@errors/bad-request'
import { NotFoundError } from '@/http/@errors/not-found'
import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { normalizeRoomName } from '@/utils/app/room-utils'

export async function updateRoom(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/update/:id',
      {
        schema: {
          tags: ['rooms'],
          summary: 'Atualiza uma sala',
          params: z.object({
            id: z.cuid(),
          }),
          body: z.object({
            name: z.string().min(1).optional(),
            standardTime: z.number().int().positive().optional(),
            description: z.string().optional(),
          }),
          response: {
            200: z.object({
              message: z.string(),
            }),
          },
        },
      },
      async (request, reply) => {
        await request.checkIfEmployeeIsAdmin()

        const { id } = request.params
        const { name, standardTime, description } = request.body

        const room = await prisma.rooms.findUnique({
          where: { id },
          select: {
            id: true,
            normalizedName: true,
            name: true,
          },
        })

        if (!room) {
          throw new NotFoundError('Sala não encontrada.')
        }

        let normalizedName: string | undefined

        if (name && name !== room.name) {
          // Crie a versão normalizada do nome usando o utilitário
          normalizedName = normalizeRoomName(name)

          const roomAlreadyExists = await prisma.rooms.findUnique({
            where: {
              normalizedName,
            },
          })

          if (roomAlreadyExists) {
            throw new BadRequestError('Já existe uma sala com um nome muito parecido ou idêntico.')
          }
        }

        try {
          // Monta dinamicamente apenas os campos que foram realmente enviados na requisição.
          const dataToUpdate = {
            ...(name && {
              name,
              normalizedName, // Usa a versão já calculada acima
            }),
            ...(standardTime && { standardTime }),
            ...(description && { description }),
            updatedAt: new Date(),
          }

          await prisma.rooms.update({
            where: { id },
            data: dataToUpdate,
          })

          return reply.status(200).send({ message: 'Sala atualizada com sucesso.' })
        } catch (err) {
          console.error('Não foi possível atualizar a sala.', err)
          throw new BadRequestError('Não foi possível atualizar a sala.')
        }
      }
    )
}

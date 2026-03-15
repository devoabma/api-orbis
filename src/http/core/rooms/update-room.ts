import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '@/http/@errors/bad-request'
import { NotFoundError } from '@/http/@errors/not-found'
import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

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
        })

        if (!room) {
          throw new NotFoundError('Sala não encontrada.')
        }

        if (name && name !== room.name) {
          // Crie a versão normalizada do nome
          const normalizedName = name.toLowerCase().replace(/[\s-]+/g, '') // Remove espaços e hífens

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
          // O operador "..." espalha os pares chave/valor apenas se a condição for verdadeira.
          // Exemplo: se "name" existir, adiciona { name }, caso contrário não adiciona nada.
          // Isso evita enviar campos undefined para o Prisma e mantém o update limpo.
          const dataToUpdate = {
            ...(name && {
              name,
              normalizedName: name.toLowerCase().replace(/[\s-]+/g, ''), // Atualiza o nome normalizado junto
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

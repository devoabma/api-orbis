import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '@/http/@errors/bad-request'
import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

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
            name: z.string().trim().min(1),
            standardTime: z.number().int().positive().optional(),
            description: z.string().optional(),
          }),
          response: {
            201: z.null(),
          },
        },
      },
      async (request, reply) => {
        // somente administradores podem criar novas salas
        await request.checkIfEmployeeIsAdmin()

        const { name, standardTime, description } = request.body

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

        await prisma.rooms.create({
          data: {
            name,
            normalizedName,
            standardTime,
            description,
          },
        })

        return reply.status(201).send()
      }
    )
}

import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '@/http/@errors/bad-request'
import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function createComputer(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/create',
      {
        schema: {
          tags: ['computers'],
          summary: 'Criação de um novo computador',
          security: [{ bearerAuth: [] }],
          body: z.object({
            mac_code: z.string().trim().nonempty(),
            number: z.number().int().positive(),
            description: z.string(),
            roomId: z.cuid(),
          }),
          response: {
            201: z.object({
              mac_code: z.string(),
            }),
          },
        },
      },
      async (request, reply) => {
        await request.checkIfEmployeeIsAdmin()

        const { mac_code, number, description, roomId } = request.body

        // Crie a versão normalizada do código MAC (remova espaços, hifen, etc.)
        const normalizedMac = mac_code.trim().toLowerCase().replace(/[:-]/g, '')

        if (normalizedMac.length !== 12) {
          throw new BadRequestError('O código MAC deve ter 12 caracteres.')
        }

        const computerWithSameMacCode = await prisma.computers.findUnique({
          where: {
            mac_code: normalizedMac,
          },
        })

        if (computerWithSameMacCode) {
          throw new BadRequestError('Já existe um computador cadastrado com este código MAC.')
        }

        const room = await prisma.rooms.findUnique({
          where: {
            id: roomId,
          },
        })

        if (!room) {
          throw new BadRequestError('Sala informada não existe.')
        }

        // Verifique se já existe um computador com o mesmo número nesta sala
        const computerWithSameNumber = await prisma.computers.findFirst({
          where: { number, roomId },
        })

        if (computerWithSameNumber) {
          throw new BadRequestError('Já existe um computador com esse número nesta sala.')
        }

        const computerWithSameDescription = await prisma.computers.findFirst({
          where: { description, roomId },
        })

        if (computerWithSameDescription) {
          throw new BadRequestError('Já existe um computador com essa descrição nesta sala.')
        }

        const computer = await prisma.computers.create({
          data: {
            mac_code: normalizedMac,
            number,
            description,
            roomId,
          },
        })

        return reply.status(201).send({
          mac_code: computer.mac_code,
        })
      }
    )
}

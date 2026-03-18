import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '@/http/@errors/bad-request'
import { NotFoundError } from '@/http/@errors/not-found'
import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function updateComputer(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/update/:id',
      {
        schema: {
          tags: ['computers'],
          summary: 'Atualizar dados de um computador',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.cuid(),
          }),
          body: z.object({
            mac_code: z.string().trim().optional(),
            number: z.number().int().positive().optional(),
            description: z.string().optional(),
          }),
          response: {
            200: z.null().describe('Computador atualizado com sucesso.'),
          },
        },
      },
      async (request, reply) => {
        await request.checkIfEmployeeIsAdmin()

        const { id } = request.params
        const { mac_code, number, description } = request.body

        // Busca o computador e sua sala de forma manual para um erro amigável
        const computer = await prisma.computers.findUnique({
          where: { id },
          select: {
            id: true,
            roomId: true,
            room: {
              select: {
                inactive: true,
              },
            },
          },
        })

        if (!computer) {
          throw new NotFoundError('Computador não encontrado.')
        }

        if (computer.room.inactive) {
          throw new BadRequestError('Não é possível atualizar computadores de uma sala inativa.')
        }

        const roomId = computer.roomId

        // Normalização manual do MAC (12 caracteres hex)
        const normalizedMac = mac_code ? mac_code.trim().toLowerCase().replace(/[:-]/g, '') : undefined

        if (normalizedMac && normalizedMac.length !== 12) {
          throw new BadRequestError('O código MAC deve ter exatos 12 caracteres hexadecimais.')
        }

        if (normalizedMac !== undefined) {
          // Verifique se existe outro computador com o mesmo código MAC nesta sala, exceto o computador atual
          const computerWithSameMac = await prisma.computers.findFirst({
            where: {
              mac_code: normalizedMac,
              NOT: { id },
            },
          })
          if (computerWithSameMac) {
            throw new BadRequestError('Já existe um computador com esse código MAC.')
          }
        }

        if (number !== undefined) {
          // Verifique se existe outro computador com o mesmo número nesta sala, exceto o computador atual
          const computerWithSameNumber = await prisma.computers.findFirst({
            where: {
              number,
              roomId,
              NOT: { id },
            },
          })
          if (computerWithSameNumber) {
            throw new BadRequestError('Já existe um computador com esse número nesta sala.')
          }
        }

        if (description !== undefined) {
          // Verifique se existe outro computador com a mesma descrição nesta sala, exceto o computador atual
          const computerWithSameDescription = await prisma.computers.findFirst({
            where: {
              description,
              roomId,
              NOT: { id },
            },
          })
          if (computerWithSameDescription) {
            throw new BadRequestError('Já existe um computador com essa descrição nesta sala.')
          }
        }

        const dataToUpdate = {
          ...(normalizedMac && { mac_code: normalizedMac }),
          ...(number !== undefined && { number }),
          ...(description !== undefined && { description }),
        }

        try {
          await prisma.computers.update({
            where: { id },
            data: dataToUpdate,
          })

          return reply.status(200).send(null)
        } catch (err) {
          request.log.error({ err }, 'Erro ao atualizar computador')
          // Repassamos o erro para o errorHandler que agora trata Prisma P2002
          throw err
        }
      }
    )
}

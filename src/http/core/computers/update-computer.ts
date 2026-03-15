import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '@/http/@errors/bad-request'
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
            200: z.null(),
          },
        },
      },
      async (request, reply) => {
        await request.checkIfEmployeeIsAdmin()

        // Obtenha o ID da sala do computador
        const { id } = request.params
        // Obtenha o ID da sala do computador retornando um erro caso ele não seja encontrado
        const { roomId } = await prisma.computers.findUniqueOrThrow({
          where: { id },
          select: { roomId: true },
        })

        const { mac_code, number, description } = request.body

        // Crie a versão normalizada do código MAC (remova espaços, hifen, etc.)
        const normalizedMac = mac_code ? mac_code.trim().toLowerCase().replace(/[:-]/g, '') : undefined

        // Crie a versão normalizada do código MAC (remova espaços, hifen, etc.)
        if (normalizedMac && normalizedMac.length !== 12) {
          throw new BadRequestError('O código MAC deve ter 12 caracteres.')
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

        await prisma.computers.update({
          where: { id },
          data: dataToUpdate,
        })

        return reply.status(200).send()
      }
    )
}

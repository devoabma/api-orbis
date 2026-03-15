import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '@/http/@errors/bad-request'
import { NotFoundError } from '@/http/@errors/not-found'
import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function linkEmployeeToRooms(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/link-to-rooms',
      {
        schema: {
          tags: ['employees'],
          summary: 'Vincula um funcionário a uma sala ou várias salas',
          security: [{ bearerAuth: [] }],
          body: z.object({
            employeeId: z.cuid(),
            roomIds: z.array(z.cuid()),
          }),
          response: {
            200: z.null().describe('Funcionário vinculado às salas com sucesso'),
          },
        },
      },
      async (request, reply) => {
        await request.checkIfEmployeeIsAdmin()

        const { employeeId, roomIds } = request.body

        const [employee, rooms] = await Promise.all([
          prisma.employees.findUnique({ where: { id: employeeId }, select: { id: true } }),
          prisma.rooms.findMany({
            where: { id: { in: roomIds } },
            select: { id: true, name: true, inactive: true },
          }),
        ])

        if (!employee) {
          throw new NotFoundError('Funcionário não encontrado.')
        }

        // Verificar se todas as salas solicitadas foram encontradas
        if (rooms.length !== roomIds.length) {
          throw new BadRequestError('Uma ou mais salas não foram encontradas.')
        }

        // Verificar se alguma sala está inativa
        const inactiveRooms = rooms.filter(room => room.inactive !== null)

        if (inactiveRooms.length > 0) {
          const inactiveRoomNames = inactiveRooms.map(room => room.name).join(', ')
          throw new BadRequestError(`Não é possível vincular funcionário a salas inativas: ${inactiveRoomNames}`)
        }

        // Verificar vinculações existentes para evitar duplicação
        const existingLinks = await prisma.employeesRooms.findMany({
          where: {
            employeeId,
            roomId: {
              in: roomIds,
            },
          },
          select: { roomId: true },
        })

        // Verificar se o funcionário já está vinculado às salas solicitadas
        if (existingLinks.length) {
          const existingRoomNames = rooms
            // O some() dentro do filter() verifica se o room.id está em existingLinks
            .filter(room => existingLinks.some(link => link.roomId === room.id))
            .map(room => room.name)
            .join(', ')

          throw new BadRequestError(`Funcionário já está vinculado às seguintes salas: ${existingRoomNames}`)
        }

        // Criar as vinculações de forma batch, para evitar problemas de concorrência e garantir que todas as vinculações sejam criadas
        await prisma.employeesRooms.createMany({
          data: roomIds.map(roomId => ({
            employeeId,
            roomId,
          })),
        })

        return reply.status(200).send(null)
      }
    )
}

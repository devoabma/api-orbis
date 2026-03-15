import dayjs from 'dayjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '@/http/@errors/bad-request'
import { prisma } from '@/lib/prisma'

export async function closeSessionByLawyer(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/release-computer/:sessionId/close',
    {
      schema: {
        tags: ['lawyers'],
        summary: 'Advogado encerra sua própria sessão de computador',
        params: z.object({
          sessionId: z.cuid(),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            remainingTime: z.number().int().nonnegative(),
          }),
        },
      },
    },
    async (req, reply) => {
      const { sessionId } = req.params

      const session = await prisma.computerSessions.findUnique({
        where: { id: sessionId },
        include: {
          computer: { include: { room: true } },
          lawyer: true,
        },
      })

      if (!session) {
        throw new BadRequestError('Sessão não encontrada.')
      }

      if (session.endedAt) {
        throw new BadRequestError('Sessão já encerrada.')
      }

      const today = dayjs()
      const startedAt = dayjs(session.startedAt)
      const totalMinutes = session.computer.room.standardTime ?? 180
      const usedMinutes = today.diff(startedAt, 'minute')
      // Calcula o tempo restante, garantindo que não seja negativo
      const remainingTime = Math.max(totalMinutes - usedMinutes, 0) as number

      await prisma.$transaction([
        prisma.computerSessions.update({
          where: { id: session.id },
          data: { endedAt: today.toDate() },
        }),
        prisma.computers.update({
          where: { id: session.computerId },
          data: {
            inUse: false,
            currentLawyerId: null,
          },
        }),
        prisma.lawyers.update({
          where: { id: session.lawyerId },
          data: { lastAccess: today.toDate(), remainingTime },
        }),
      ])

      console.log(`[ManualClose] Sessão encerrada manualmente pelo advogado: ${session.lawyer.name}`)

      return reply.status(200).send({ success: true, remainingTime })
    }
  )
}

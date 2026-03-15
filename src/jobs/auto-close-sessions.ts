import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { prisma } from '@/lib/prisma'

dayjs.extend(utc)

const INTERVAL_MS = 10 * 1000 // 10 segundos

async function checkExpiredSessions() {
  const today = dayjs().utc()

  const candidateSessions = await prisma.computerSessions.findMany({
    where: { endedAt: null },
    include: {
      computer: { include: { room: true } },
      lawyer: true,
    },
  })

  if (!candidateSessions.length) return

  for (const session of candidateSessions) {
    const limitMinutes = session.lawyer.remainingTime ? session.lawyer.remainingTime : (session.computer.room.standardTime ?? 180)

    const startedAt = dayjs(session.startedAt).utc()
    const diff = today.diff(startedAt, 'minute')

    if (diff >= limitMinutes) {
      await prisma.$transaction([
        prisma.computerSessions.update({
          where: { id: session.id },
          data: { endedAt: today.toDate() },
        }),
        prisma.computers.update({
          where: { id: session.computerId },
          data: { inUse: false, currentLawyerId: null },
        }),
        prisma.lawyers.update({
          where: { id: session.lawyerId },
          data: { remainingTime: null, lastAccess: null },
        }),
      ])

      console.log(`[AutoClose ✅] Sessão ${session.id} encerrada automaticamente (tempo: ${diff}min, limite: ${limitMinutes}).`)
    }
  }
}

export function startAutoCloseSessionsJob() {
  async function run() {
    try {
      await checkExpiredSessions()
    } catch (err) {
      console.error('[AutoClose ❌] Erro ao verificar sessões expiradas:', err)
    } finally {
      setTimeout(run, INTERVAL_MS) // ← só agenda o próximo DEPOIS de terminar
    }
  }

  run()
}

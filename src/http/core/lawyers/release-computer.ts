import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '@/http/@errors/bad-request'
import { NotFoundError } from '@/http/@errors/not-found'
import { UnauthorizedError } from '@/http/@errors/unauthorized'
import { PROTHEUS_DATA_URL } from '@/lib/axios'
import { prisma } from '@/lib/prisma'

dayjs.extend(utc)

interface LawyersProps {
  lawyer: {
    nome: string
    registro: string
    categoria: string
    cpf: string
    adimplente: boolean
    email: string
    dataNascimento: string
  }
}

export function releaseComputer(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/release-computer',
    {
      schema: {
        tags: ['lawyers'],
        summary: 'Advogado libera um computador para uso',
        security: [{ bearerAuth: [] }],
        body: z.object({
          cpf: z.string().trim().max(11),
          oab: z.string().trim(),
          birth: z.string().trim(),
          mac_code: z.string().trim(),
        }),
        response: {
          200: z.object({
            sessionId: z.cuid(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { cpf, oab, birth, mac_code } = request.body
      const normalizedMac = mac_code.trim().toLowerCase().replace(/[:-]/g, '')

      if (normalizedMac.length !== 12) {
        throw new BadRequestError('O código MAC deve ter 12 caracteres.')
      }

      // --- Verifica advogado no Protheus ---
      const response = await PROTHEUS_DATA_URL<LawyersProps>('/', {
        params: { idOrg: 10, param: cpf },
      })

      const { lawyer: consultedLawyer } = response.data

      if (!consultedLawyer.adimplente) {
        throw new UnauthorizedError('Não foi possível liberar o computador. Entre em contato com o Setor Financeiro.')
      }

      const formattedBirth = dayjs(consultedLawyer.dataNascimento).utc().format('DDMMYYYY')

      if (consultedLawyer.cpf !== cpf || consultedLawyer.registro !== oab || formattedBirth !== birth) {
        throw new UnauthorizedError('Credenciais inválidas. Verifique suas informações e tente novamente.')
      }

      // --- Valida computador ---
      const computer = await prisma.computers.findUnique({
        where: { mac_code: normalizedMac },
        include: { room: true },
      })

      if (!computer) {
        throw new NotFoundError('Computador não encontrado.')
      }

      if (computer.room.inactive) {
        throw new BadRequestError('Sala inativa. Contate a administração.')
      }

      if (computer.maintenance) {
        throw new BadRequestError('Computador em manutenção.')
      }

      // --- Verifica advogado no banco ---
      let lawyer = await prisma.lawyers.findUnique({ where: { cpf } })

      if (!lawyer) {
        const lawyerAlreadyExistsByEmail = await prisma.lawyers.findUnique({
          where: { email: consultedLawyer.email },
        })

        if (lawyerAlreadyExistsByEmail) {
          throw new BadRequestError('Já existe um advogado cadastrado com esse email.')
        }

        lawyer = await prisma.lawyers.create({
          data: {
            name: consultedLawyer.nome,
            email: consultedLawyer.email,
            oab,
            cpf,
            birth: formattedBirth,
            category: consultedLawyer.categoria,
          },
        })
      }

      let limitMinutes: number

      const lastAccessIsToday = lawyer.lastAccess && dayjs(lawyer.lastAccess).utc().startOf('day')
      const today = dayjs().utc().startOf('day')

      if (lastAccessIsToday && !lastAccessIsToday.isSame(today)) {
        limitMinutes = computer.room.standardTime ?? 180 // Tempo padrão: 3h
      } else {
        limitMinutes = lawyer.remainingTime ? lawyer.remainingTime : (computer.room.standardTime ?? 180)
      }

      // --- Verifica se o advogado já possui uma sessão ativa em qualquer computador ---
      const activeSession = await prisma.computerSessions.findFirst({
        where: { lawyerId: lawyer.id, endedAt: null },
        include: {
          computer: {
            include: {
              room: true,
            },
          },
        },
        orderBy: { startedAt: 'desc' }, // Pega a sessão mais recente
      })

      if (activeSession) {
        // Se o advogado já está usando outro computador, bloqueia
        if (activeSession.computer.mac_code !== normalizedMac) {
          throw new BadRequestError(`Você já possui uma sessão ativa em ${activeSession.computer.room.name}.`)
        }

        const startedAt = dayjs(activeSession.startedAt).utc()
        const today = dayjs().utc()
        const differenceInMinutes = today.diff(startedAt, 'minute')

        // Se já passou do limite, encerra automaticamente
        if (differenceInMinutes >= limitMinutes) {
          // Usa transação para garantir que ambas as operações ocorram juntas
          await prisma.$transaction([
            prisma.computerSessions.update({
              where: {
                id: activeSession.id,
              },
              data: {
                endedAt: today.toDate(),
              },
            }),
            prisma.computers.update({
              where: {
                id: activeSession.computerId,
              },
              data: {
                inUse: false,
                currentLawyerId: null,
              },
            }),
            prisma.lawyers.update({
              where: {
                id: lawyer.id,
              },
              data: {
                lastAccess: null,
                remainingTime: null,
              },
            }),
          ])
        } else {
          // Ainda dentro do tempo → bloqueia nova liberação
          const remainingTime = limitMinutes - differenceInMinutes

          if (remainingTime === 1) {
            throw new BadRequestError(`Você ainda possui ${remainingTime} minuto restante em uma sessão ativa.`)
          }

          throw new BadRequestError(`Você ainda possui ${remainingTime} minutos restantes em uma sessão ativa.`)
        }
      }

      // --- Verifica se o advogado já esgotou o tempo diário ---
      const todayStart = dayjs().utc().startOf('day')
      const todayEnd = dayjs().utc().endOf('day')

      // Busca todas as sessões encerradas do advogado no dia atual
      const sessionsToday = await prisma.computerSessions.findMany({
        where: {
          lawyerId: lawyer.id,
          startedAt: { gte: todayStart.toDate(), lte: todayEnd.toDate() },
          endedAt: { not: null },
        },
        select: {
          startedAt: true,
          endedAt: true,
          computer: {
            select: {
              room: { select: { standardTime: true } },
            },
          },
        },
      })

      let totalUsedMinutes = 0

      for (const session of sessionsToday) {
        const start = dayjs(session.startedAt)
        const end = dayjs(session.endedAt)
        // Se o advogado usou o computador, adiciona o tempo usado na soma e o diff quer dizer quantos minutos ele usou
        totalUsedMinutes += end.diff(start, 'minute')
      }

      // Tempo limite da sala onde ele está tentando logar
      const dailyLimit = computer.room.standardTime ?? 180

      if (totalUsedMinutes >= dailyLimit) {
        throw new BadRequestError('Você já utilizou todo o seu tempo disponível para esta sala hoje. Tente novamente amanhã.')
      }

      // Se nao houver sessão ativa, verifca se o computador está em uso por outro advogado
      if (computer.inUse) {
        throw new BadRequestError('Computador em uso.')
      }

      // Cria a sessão do computador para o advogado e marca o computador como em uso
      const [_, computerSession] = await prisma.$transaction([
        prisma.computers.update({
          where: { mac_code: normalizedMac },
          data: { inUse: true, currentLawyerId: lawyer.id },
        }),

        prisma.computerSessions.create({
          data: {
            computerId: computer.id,
            lawyerId: lawyer.id,
            startedAt: dayjs().utc().toDate(),
          },
        }),
      ])

      return reply.status(200).send({
        sessionId: computerSession.id,
      })
    }
  )
}

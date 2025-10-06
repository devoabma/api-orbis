import type { FastifyInstance } from 'fastify'
import { fastifyPlugin } from 'fastify-plugin'
import { prisma } from '@/lib/prisma'
import { BadRequestError } from '../@errors/bad-request'
import { UnauthorizedError } from '../@errors/unauthorized'

export const auth = fastifyPlugin(async (app: FastifyInstance) => {
  app.addHook('preHandler', async request => {
    // Verifica se o usuário está autenticado e retorna o ID do funcionário
    request.getCurrentEmployeeId = async () => {
      try {
        const { sub } = await request.jwtVerify<{ sub: string }>()

        return sub
      } catch {
        throw new BadRequestError('Token inválido ou expirado. Faça login novamente.')
      }
    }

    // Verifica se o funcionário é um administrador
    request.checkIfEmployeeIsAdmin = async () => {
      const { sub } = await request.jwtVerify<{ sub: string }>().catch(() => {
        throw new UnauthorizedError('Token inválido ou expirado. Verifique as informações e tente novamente.')
      })

      const employee = await prisma.employees.findUnique({
        where: { id: sub },
        select: { role: true },
      })

      if (!employee || employee.role !== 'ADMIN') {
        throw new UnauthorizedError('Acesso negado. Você não tem permissão para acessar este recurso.')
      }
    }
  })
})

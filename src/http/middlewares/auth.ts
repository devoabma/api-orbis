import type { FastifyInstance } from 'fastify'
import { fastifyPlugin } from 'fastify-plugin'

export const auth = fastifyPlugin(async (app: FastifyInstance) => {
  app.addHook('preHandler', async (request, reply) => {
    // Verifica se o usuário está autenticado e retorna o ID do funcionário
    request.getCurrentEmployeeId = async () => {
      try {
        const { sub } = await request.jwtVerify<{ sub: string }>()

        return sub
      } catch {
        return reply.status(401).send({ message: 'Token inválido ou expirado. Faça login novamente.' })
      }
    }
  })
})

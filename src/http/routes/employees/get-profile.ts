import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'

export async function getProfile(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/profile',
    {
      schema: {
        tags: ['employees'],
        summary: 'Retorna o perfil do usuário logado',
        security: [{ bearerAuth: [] }],
        response: {},
      },
    },
    async (request, reply) => {
      console.log(request.user)
    }
  )
}

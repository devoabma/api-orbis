import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '@/http/middlewares/auth'

export async function getAllReleases(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/get-all/:roomId?',
      {
        schema: {
          tags: ['lawyers'],
          summary: 'Retorna todas as sessões de computadores ou por sala',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            pageIndex: z.coerce.number().default(1),
            released: z.boolean().optional(),
          }),
          params: z.object({
            roomId: z.cuid().optional(),
          }),
          response: {
            200: z.object({
              totalOfReleases: z.number(),
              totalPages: z.number(),
            }),
          },
        },
      },
      async (request, reply) => {
        const employee = await request.getCurrentEmployeeId()

        const { pageIndex, released } = request.query

        console.log(employee)
      }
    )
}

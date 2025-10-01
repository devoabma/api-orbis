import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

export async function createAccount(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/create-account',
    {
      schema: {
        body: z.object({
          name: z.string().trim().min(1, 'O nome é obrigatório'),
          cpf: z.string().trim().max(11, 'O CPF é obrigatório'),
          email: z.email('O e-mail é obrigatório'),
          password: z.string().trim().min(6, 'A senha é obrigatória'),
        }),
      },
    },
    (_request, _reply) => {
      return 'Employee created'
    }
  )
}

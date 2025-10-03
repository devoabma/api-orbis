import { hash } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '@/http/@errors/bad-request'
import { prisma } from '@/lib/prisma'

export async function createAccount(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/create-account',
    {
      schema: {
        tags: ['employees'],
        summary: 'Criação de um novo funcionário',
        security: [{ bearerAuth: [] }],
        body: z.object({
          name: z.string().trim().min(1, 'O nome é obrigatório'),
          cpf: z.string().trim().max(11, 'O CPF é obrigatório'),
          email: z.email('O e-mail é obrigatório'),
          password: z.string().trim().min(6, 'A senha é obrigatória'),
        }),
        response: {
          201: z.null(),
        },
      },
    },
    async (request, reply) => {
      // TODO: Implementar logica que somente um admin pode criar uma nova conta

      const { name, cpf, email, password } = request.body

      const employeeWithSameCpf = await prisma.employees.findUnique({
        where: {
          cpf,
        },
      })

      if (employeeWithSameCpf) {
        throw new BadRequestError('Já existe um funcionário com esse CPF.')
      }

      const employeeWithSameEmail = await prisma.employees.findUnique({
        where: {
          email,
        },
      })

      if (employeeWithSameEmail) {
        throw new BadRequestError('Já existe um funcionário com esse e-mail.')
      }

      // Encripta a senha do funcionário
      const passwordHash = await hash(password, 6)

      try {
        await prisma.employees.create({
          data: {
            name,
            cpf,
            email,
            passwordHash,
          },
        })

        return reply.status(201).send()
      } catch {
        throw new BadRequestError('Erro ao criar funcionário. Por favor, tente novamente.')
      }
    }
  )
}

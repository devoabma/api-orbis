import { hash } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

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
        response: {
          201: z.null(),
          400: z.object({
            message: z.string(),
          }),
          500: z.object({
            message: z.string(),
          }),
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
        return reply.status(400).send({
          message: 'Já existe um funcionário com esse CPF.',
        })
      }

      const employeeWithSameEmail = await prisma.employees.findUnique({
        where: {
          email,
        },
      })

      if (employeeWithSameEmail) {
        return reply.status(400).send({
          message: 'Já existe um funcionário com esse e-mail.',
        })
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
      } catch (err) {
        console.log(err)
        return reply.status(500).send({
          message: 'Houve um erro ao criar o funcionário.',
        })
      }
    }
  )
}

import { compare } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { env } from '@/http/env'
import { prisma } from '@/lib/prisma'

export async function authenticate(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/session/auth',
    {
      schema: {
        tags: ['employees'],
        summary: 'Autenticação de um funcionário',
        body: z.object({
          cpf: z.string().trim().max(11, 'O CPF é obrigatório'),
          password: z.string().trim().min(6, 'A senha é obrigatória'),
        }),
        response: {
          201: z.object({
            token: z.string(),
          }),
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
      const { cpf, password } = request.body

      const employeeFromCPF = await prisma.employees.findUnique({
        where: {
          cpf,
        },
      })

      // Verifica se o funcionário existe e se ele esta ativo
      if (employeeFromCPF && employeeFromCPF.inactive !== null) {
        return reply.status(400).send({ message: 'O funcionário está inativo. Entre em contato com o administrador.' })
      }

      if (!employeeFromCPF) {
        return reply.status(400).send({ message: 'Credenciais inválidas. Verifique suas informações e tente novamente.' })
      }

      const isPasswordValid = await compare(password, employeeFromCPF.passwordHash)

      if (!isPasswordValid) {
        return reply.status(400).send({ message: 'Credenciais inválidas. Verifique suas informações e tente novamente.' })
      }

      // Criação do token de autenticação
      const token = await reply.jwtSign(
        {
          sub: employeeFromCPF.id,
          role: employeeFromCPF.role,
        },
        {
          sign: {
            expiresIn: '1d',
          },
        }
      )

      return reply
        .setCookie('@orbis-auth', token, {
          path: '/',
          httpOnly: true,
          secure: env.NODE_ENV === 'production',
          sameSite: 'lax',
          domain: env.DOMAIN_URL,
          maxAge: 1000 * 60 * 60 * 24, // 1 dia
        })
        .status(201)
        .send({
          token,
        })
    }
  )
}

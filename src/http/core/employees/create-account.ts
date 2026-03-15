import { hash } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '@/http/@errors/bad-request'
import { env } from '@/http/env'
import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { resend } from '@/lib/resend'
import { EmployeeSignUpEmail } from '@/utils/emails/employee-signup-email'

export async function createAccount(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/create-account',
      {
        schema: {
          tags: ['employees'],
          summary: 'Criação de um novo funcionário',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string().trim().min(1),
            cpf: z.string().trim().length(11),
            email: z.email(),
            password: z.string().trim().min(6),
          }),
          response: {
            201: z.null().describe('Funcionário criado com sucesso'),
          },
        },
      },
      async (request, reply) => {
        // somente administradores podem criar novos funcionários
        await request.checkIfEmployeeIsAdmin()

        const { name, cpf, email, password } = request.body

        const [employeeWithSameCpf, employeeWithSameEmail] = await Promise.all([
          prisma.employees.findUnique({ where: { cpf }, select: { id: true } }),
          prisma.employees.findUnique({ where: { email }, select: { id: true } }),
        ])

        if (employeeWithSameCpf) {
          throw new BadRequestError('Já existe um funcionário com esse CPF.')
        }

        if (employeeWithSameEmail) {
          throw new BadRequestError('Já existe um funcionário com esse e-mail.')
        }

        // Encripta a senha do funcionário
        const passwordHash = await hash(password, 10)

        try {
          await prisma.employees.create({
            data: {
              name,
              cpf,
              email,
              passwordHash,
            },
          })

          // Envia o e-mail de boas-vindas
          await resend.emails.send({
            from: '📧 Sala Livre <nao-responda@hit.dev.br>',
            to: env.NODE_ENV === 'production' ? email : 'hilquiasfmelo@hotmail.com',
            subject: '🎉 Bem-vindo à equipe! Aqui estão suas informações.',
            react: EmployeeSignUpEmail({
              name,
              cpf,
              email,
              tempPassword: password,
              link: env.WEB_URL,
            }),
          })

          return reply.status(201).send(null)
        } catch (error) {
          request.log.error({ err: error }, 'Erro ao criar funcionário')
          throw new BadRequestError('Erro ao criar funcionário. Por favor, tente novamente.')
        }
      }
    )
}

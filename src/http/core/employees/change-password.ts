import { compare, hash } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '@/http/@errors/bad-request'
import { env } from '@/http/env'
import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { resend } from '@/lib/resend'
import { PasswordChangedEmail } from '@/utils/emails/password-changed-email'

export async function changePassword(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/auth/change-password',
      {
        schema: {
          tags: ['employees'],
          summary: 'Altera a senha do usuário logado',
          security: [{ bearerAuth: [] }],
          body: z.object({
            currentPassword: z.string().trim().min(6),
            newPassword: z.string().trim().min(6),
            confirmNewPassword: z.string().trim().min(6),
          }),
          response: {
            200: z.null(),
          },
        },
      },
      async (request, reply) => {
        const employeeId = await request.getCurrentEmployeeId()

        if (!employeeId) {
          throw new BadRequestError('Token inválido ou expirado. Faça login novamente.')
        }

        const { currentPassword, newPassword, confirmNewPassword } = request.body

        const employee = await prisma.employees.findUnique({
          where: {
            id: employeeId,
          },
        })

        if (!employee) {
          throw new BadRequestError('Token inválido ou expirado. Faça login novamente.')
        }

        const isPasswordCorrect = await compare(currentPassword, employee.passwordHash)

        if (!isPasswordCorrect) {
          throw new BadRequestError('Senha atual incorreta.')
        }

        if (newPassword === currentPassword) {
          throw new BadRequestError('A nova senha deve ser diferente da senha atual.')
        }

        if (newPassword !== confirmNewPassword) {
          throw new BadRequestError('As senhas devem ser iguais.')
        }

        const newPasswordHash = await hash(newPassword, 6)

        try {
          await resend.emails.send({
            from: '📧 Sala Livre <salalivre@oabma.com.br>',
            to: env.NODE_ENV === 'production' ? employee.email : 'hilquiasfmelo@hotmail.com',
            subject: '🔑 Alteração de senha',
            react: PasswordChangedEmail({
              name: employee.name,
              link: env.WEB_URL,
            }),
          })

          await prisma.employees.update({
            where: {
              id: employeeId,
            },
            data: {
              passwordHash: newPasswordHash,
            },
          })

          return reply.status(200).send()
        } catch {
          throw new BadRequestError('Erro ao alterar senha.')
        }
      }
    )
}

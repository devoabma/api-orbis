import { compare, hash } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '@/http/@errors/bad-request'
import { env } from '@/http/env'
import { prisma } from '@/lib/prisma'
import { resend } from '@/lib/resend'
import { PasswordChangedEmail } from '@/utils/emails/password-changed-email'

export async function resetPassword(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/reset-password',
    {
      schema: {
        tags: ['employees'],
        summary: 'Redefinição de senha',
        security: [{ bearerAuth: [] }],
        body: z.object({
          code: z.string(),
          password: z.string().min(6),
          confirmPassword: z.string().min(6),
        }),
        response: {
          204: z.null(),
        },
      },
    },
    async (request, reply) => {
      const { code, password, confirmPassword } = request.body

      const tokenFromCode = await prisma.tokens.findUnique({
        where: {
          code,
        },
      })

      if (!tokenFromCode) {
        throw new BadRequestError('Código de redefinição de senha inválido.')
      }

      if (tokenFromCode.expiresAt && tokenFromCode.expiresAt < new Date()) {
        throw new BadRequestError('Código de redefinição de senha expirado.')
      }

      const employee = await prisma.employees.findUnique({
        where: {
          id: tokenFromCode.employeeId,
        },
      })

      if (!employee) {
        throw new BadRequestError('Funcionário não encontrado.')
      }

      const isSamePassword = await compare(password, employee.passwordHash)

      if (isSamePassword) {
        throw new BadRequestError('A nova senha deve ser diferente da senha atual.')
      }

      if (password !== confirmPassword) {
        throw new BadRequestError('As senhas devem ser iguais.')
      }

      const passwordHash = await hash(password, 6)

      await prisma.employees.update({
        where: {
          id: tokenFromCode.employeeId,
        },
        data: {
          passwordHash,
        },
      })

      // Invalida o token imediatamente
      await prisma.tokens.update({
        where: {
          id: tokenFromCode.id,
        },
        data: {
          expiresAt: new Date(),
        },
      })

      await resend.emails.send({
        from: '📧 Sala Livre <salalivre@oabma.com.br>',
        to: env.NODE_ENV === 'production' ? employee.email : 'hilquiasfmelo@hotmail.com',
        subject: 'Redefinição de senha',
        react: PasswordChangedEmail({
          name: employee.name,
          link: env.WEB_URL,
        }),
      })

      return reply.status(204).send()
    }
  )
}

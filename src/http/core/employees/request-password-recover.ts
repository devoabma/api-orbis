import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '@/http/@errors/bad-request'
import { env } from '@/http/env'
import { prisma } from '@/lib/prisma'
import { resend } from '@/lib/resend'
import { generateRecoveryCode } from '@/utils/app/generate-recovery-code'
import { ResetPasswordEmail } from '@/utils/emails/reset-password-email'

export async function requestPasswordRecover(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/password-recover',
    {
      schema: {
        tags: ['employees'],
        summary: 'Requisição de redefinição de senha',
        body: z.object({
          cpf: z.string().trim().length(11),
          email: z.email(),
        }),
        response: {
          200: z.null().describe('Requisição de redefinição de senha realizada com sucesso'),
        },
      },
    },
    async (request, reply) => {
      const { cpf, email } = request.body

      const employee = await prisma.employees.findUnique({
        where: {
          cpf,
          email,
        },
        select: { id: true, name: true },
      })

      if (!employee) {
        throw new BadRequestError('Credenciais inválidas. Verifique suas informações e tente novamente.')
      }

      const token = await prisma.tokens.create({
        data: {
          type: 'PASSWORD_RECOVER',
          employeeId: employee.id,
          code: generateRecoveryCode(),
          expiresAt: new Date(Date.now() + 3 * 60 * 1000), // 3 minutos
        },
      })

      // Envia o email informando o codígo para redefinição
      await resend.emails.send({
        from: '📧 Sala Livre <salalivre@oabma.com.br>',
        to: env.NODE_ENV === 'production' ? email : 'hilquiasfmelo@hotmail.com',
        subject: '🔄 Redefinição de Senha - Sala Livre',
        react: ResetPasswordEmail({
          name: employee.name,
          code: token.code,
          link: `${env.WEB_URL}/employees/reset-password?code=${token.code}`,
        }),
      })

      // Somente em ambiente de desenvolvimento mostra no console
      if (env.NODE_ENV === 'development') {
        console.log('> ✅ Email de redefinição de senha enviado com sucesso.', token.code)
      }

      return reply.status(200).send(null)
    }
  )
}

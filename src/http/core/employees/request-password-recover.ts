import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { email, z } from 'zod'
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
        security: [{ bearerAuth: [] }],
        body: z.object({
          cpf: z.string().trim().max(11),
          email: email(),
        }),
        response: {
          200: z.null(),
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
      })

      if (!employee) {
        throw new BadRequestError('Credenciais inválidas. Verifique suas informações e tente novamente.')
      }

      const { code } = await prisma.tokens.create({
        data: {
          type: 'PASSWORD_RECOVER',
          employeeId: employee.id,
          code: generateRecoveryCode(),
        },
      })

      // Envia o email informando o codígo para redefinição
      await resend.emails.send({
        from: '📧 Sala Livre <salalivre@oabma.com.br>',
        to: env.NODE_ENV === 'production' ? email : 'hilquiasfmelo@hotmail.com',
        subject: '🔄 Redefinição de Senha - Sala Livre',
        react: ResetPasswordEmail({
          name: employee.name,
          code,
          link: `${env.WEB_URL}/employees/reset-password?code=${code}`,
        }),
      })

      // Excluir o token após 2 minutos (120000ms)
      setTimeout(async () => {
        await prisma.tokens.delete({
          where: { code },
        })
      }, 120000)

      // Somente em ambiente de desenvolvimento mostra no console
      if (env.NODE_ENV === 'development') {
        console.log('> ✅ Email de redefinição de senha enviado com sucesso.', code)
      }

      return reply.status(200).send()
    }
  )
}

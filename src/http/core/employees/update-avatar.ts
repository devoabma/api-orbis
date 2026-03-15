import { Readable } from 'node:stream'
import { v2 as cloudinary } from 'cloudinary'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '@/http/@errors/bad-request'
import { NotFoundError } from '@/http/@errors/not-found'
import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import '@/lib/cloudinary'

export async function updateAvatar(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/update-avatar',
      {
        schema: {
          tags: ['employees'],
          summary: 'Atualiza o avatar de um funcionário',
          consumes: ['multipart/form-data'], // importante para o Swagger entender o formato do corpo da requisição
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              avatarUrl: z.url(),
            }),
          },
        },
      },
      async (request, reply) => {
        const employeeId = await request.getCurrentEmployeeId()

        // pega o arquivo enviado
        const file = await request.file()

        if (!file) {
          throw new BadRequestError('Nenhum arquivo foi enviado.')
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

        if (!allowedTypes.includes(file.mimetype)) {
          throw new BadRequestError('Tipo de arquivo inválido. Envie uma imagem JPG, PNG ou WEBP.')
        }

        const employee = await prisma.employees.findUnique({
          where: { id: employeeId },
        })

        if (!employee) {
          throw new NotFoundError('Funcionário não encontrado.')
        }

        // Se já tiver avatar antigo, deleta do Cloudinary
        if (employee.avatarPublicId) {
          try {
            await cloudinary.uploader.destroy(employee.avatarPublicId)
          } catch (err) {
            console.warn('Erro ao excluir avatar do Cloudinary:', err)
            throw new BadRequestError('Falha ao excluir o avatar.')
          }
        }

        // Faz upload para o Cloudinary via stream
        const uploadToCloudinary = (buffer: Buffer): Promise<{ url: string; publicId: string }> => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: 'orbis/employees',
                resource_type: 'image',
                public_id: `${employeeId}-${employee.name.split(' ')[0]}`,
              },
              (error, result) => {
                if (error || !result) {
                  reject(error)
                  throw new BadRequestError('Falha ao enviar o avatar.')
                } else {
                  resolve({
                    url: result.url,
                    publicId: result.asset_id,
                  })
                }
              }
            )
            // Envia o buffer para o stream do Cloudinary
            Readable.from(buffer).pipe(stream)
          })
        }

        try {
          // Aqui é transformado o arquivo recebido (`file`, que vem do Fastify) em um `Buffer`.
          // Um `Buffer` é basicamente um bloco de bytes na memória — ele contém todo o conteúdo binário da imagem.
          const buffer = await file.toBuffer()
          const { url: avatarUrl, publicId } = await uploadToCloudinary(buffer)

          await prisma.employees.update({
            where: { id: employeeId },
            data: { avatarUrl, avatarPublicId: publicId },
          })

          return reply.status(200).send({
            avatarUrl,
          })
        } catch (err) {
          console.error('Erro ao enviar avatar:', err)
          throw new BadRequestError('Falha ao enviar o avatar.')
        }
      }
    )
}

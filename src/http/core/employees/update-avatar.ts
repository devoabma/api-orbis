import { v2 as cloudinary } from 'cloudinary'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import streamifier from 'streamifier'
import { z } from 'zod'
import { BadRequestError } from '@/http/@errors/bad-request'
import { NotFoundError } from '@/http/@errors/not-found'
import { env } from '@/http/env'
import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
})

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
          description: 'Atualiza o avatar de um funcionário pelo ID',
          consumes: ['multipart/form-data'], // importante para o Swagger entender o formato do corpo da requisição
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              message: z.string(),
              avatarUrl: z.url(),
            }),
          },
        },
      },
      async (request, reply) => {
        const employeeId = await request.getCurrentEmployeeId()

        // pega o arquivo enviado
        const data = await request.file()

        if (!data) {
          throw new BadRequestError('Nenhum arquivo foi enviado.')
        }

        const employee = await prisma.employees.findUnique({
          where: { id: employeeId },
        })

        if (!employee) {
          throw new NotFoundError('Funcionário não encontrado.')
        }

        // faz upload para o Cloudinary via stream
        const uploadToCloudinary = (buffer: Buffer): Promise<string> => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: 'employees/avatars', resource_type: 'image' },
              (error, result) => {
                if (error || !result) reject(error)
                else resolve(result.secure_url)
              }
            )
            streamifier.createReadStream(buffer).pipe(stream)
          })
        }

        try {
          const buffer = await data.toBuffer()
          const avatarUrl = await uploadToCloudinary(buffer)

          await prisma.employees.update({
            where: { id: employeeId },
            data: { avatarUrl },
          })

          return reply.status(200).send({
            message: 'Avatar atualizado com sucesso.',
            avatarUrl,
          })
        } catch (err) {
          console.error('Erro ao enviar avatar:', err)
          throw new BadRequestError('Falha ao enviar o avatar.')
        }
      }
    )
}

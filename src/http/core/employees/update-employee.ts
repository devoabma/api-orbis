import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '@/http/@errors/bad-request'
import { NotFoundError } from '@/http/@errors/not-found'
import { UnauthorizedError } from '@/http/@errors/unauthorized'
import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function updateEmployee(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/update/:id',
      {
        schema: {
          tags: ['employees'],
          summary: 'Atualiza um funcionário',
          description: 'Atualiza os dados de um funcionário pelo ID',
          params: z.object({
            id: z.cuid(),
          }),
          body: z.object({
            name: z.string().min(1).optional(),
            email: z.email().optional(),
            role: z.enum(['ADMIN', 'USER']).optional(),
          }),
          response: {
            200: z.object({
              message: z.string(),
            }),
          },
        },
      },
      async (request, reply) => {
        await request.checkIfEmployeeIsAdmin()

        const { id } = request.params
        const { name, email, role } = request.body

        const employee = await prisma.employees.findUnique({
          where: { id },
        })

        if (!employee) {
          throw new NotFoundError('Funcionário não encontrado.')
        }

        if (email && email !== employee.email) {
          const emailAlreadyExists = await prisma.employees.findUnique({
            where: { email },
          })

          if (emailAlreadyExists) {
            throw new UnauthorizedError('Já existe um funcionário com esse email.')
          }
        }

        try {
          // Monta dinamicamente apenas os campos que foram realmente enviados na requisição.
          // O operador "..." espalha os pares chave/valor apenas se a condição for verdadeira.
          // Exemplo: se "name" existir, adiciona { name }, caso contrário não adiciona nada.
          // Isso evita enviar campos undefined para o Prisma e mantém o update limpo.
          const dataToUpdate = {
            ...(name && { name }),
            ...(email && { email }),
            ...(role && { role }),
            updatedAt: new Date(),
          }

          await prisma.employees.update({
            where: { id },
            data: dataToUpdate,
          })

          return reply.status(200).send({ message: 'Funcionário atualizado com sucesso.' })
        } catch (err) {
          console.error('Não foi possível atualizar o funcionário.', err)
          throw new BadRequestError('Não foi possível atualizar o funcionário.')
        }
      }
    )
}

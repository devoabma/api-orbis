import { AxiosError } from 'axios'
import type { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { BadRequestError } from './bad-request'
import { NotFoundError } from './not-found'
import { UnauthorizedError } from './unauthorized'

type FastifyErrorHandler = FastifyInstance['errorHandler']

export const errorHandler: FastifyErrorHandler = (error, _, reply) => {
  // Verificação robusta para erros de validação (Zod ou Fastify)
  const isValidationError =
    error instanceof ZodError || (error as any)?.constructor?.name === 'ZodError' || !!(error as any).validation

  if (isValidationError) {
    return reply.status(400).send({
      message: 'Erro na validação, verifique os campos e dados enviados.',
    })
  }

  if (error instanceof BadRequestError) {
    return reply.status(400).send({
      message: error.message,
    })
  }

  if (error instanceof NotFoundError) {
    return reply.status(404).send({
      message: error.message,
    })
  }

  if (error instanceof UnauthorizedError) {
    return reply.status(401).send({
      message: error.message,
    })
  }

  // Erro global disparado se não houver advogado
  if (error instanceof AxiosError) {
    return reply.status(404).send({
      message: 'Consulta indisponível ou advogado(a) não encontrado.',
    })
  }

  return reply.status(500).send({
    message: 'Erro interno do servidor. Tente novamente mais tarde.',
  })
}

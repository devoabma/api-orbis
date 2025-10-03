import { AxiosError } from 'axios'
import type { FastifyInstance } from 'fastify'
import { ZodError, z } from 'zod'
import { BadRequestError } from './bad-request'
import { UnauthorizedError } from './unauthorized'

type FastifyErrorHandler = FastifyInstance['errorHandler']

export const errorHandler: FastifyErrorHandler = (error, _request, reply) => {
  if (error.validation) {
    return reply.status(400).send({
      message: 'Erro na validação, verifique os dados enviados.',
    })
  }

  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: 'Erro na validação, verifique os dados enviados.',
      errors: z.flattenError(error).fieldErrors,
    })
  }

  if (error instanceof BadRequestError) {
    return reply.status(400).send({
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

  console.error(error)
  //TODO: Enviar erro para alguma plataforma de observabilidade
  return reply.status(500).send({
    message: 'Erro interno do servidor. Tente novamente mais tarde.',
  })
}

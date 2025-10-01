import type { FastifyInstance } from 'fastify'
import { authenticate } from './employees/authenticate'
import { createAccount } from './employees/create-account'

export async function appRoutes(app: FastifyInstance) {
  app.register(createAccount, { prefix: '/employees' })
  app.register(authenticate, { prefix: '/employees' })
}

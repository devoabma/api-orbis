import type { FastifyInstance } from 'fastify'
import { authenticate } from './employees/authenticate'
import { createAccount } from './employees/create-account'
import { getProfile } from './employees/get-profile'

export async function appRoutes(app: FastifyInstance) {
  app.register(createAccount, { prefix: '/employees' })
  app.register(authenticate, { prefix: '/employees' })
  app.register(getProfile, { prefix: '/employees' })
}

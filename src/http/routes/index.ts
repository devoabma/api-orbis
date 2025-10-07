import type { FastifyInstance } from 'fastify'
import { authenticate } from '../core/employees/authenticate'
import { changePassword } from '../core/employees/change-password'
import { createAccount } from '../core/employees/create-account'
import { getProfile } from '../core/employees/get-profile'

export async function appRoutes(app: FastifyInstance) {
  app.register(createAccount, { prefix: '/employees' })
  app.register(authenticate, { prefix: '/employees' })
  app.register(getProfile, { prefix: '/employees' })
  app.register(changePassword, { prefix: '/employees' })
}

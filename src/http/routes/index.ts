import type { FastifyInstance } from 'fastify'
import { authenticate } from '../core/employees/authenticate'
import { changePassword } from '../core/employees/change-password'
import { createAccount } from '../core/employees/create-account'
import { getAllEmployees } from '../core/employees/get-all-employees'
import { getProfile } from '../core/employees/get-profile'
import { inactiveEmployee } from '../core/employees/inactive-employee'
import { requestPasswordRecover } from '../core/employees/request-password-recover'
import { resetPassword } from '../core/employees/reset-password'

export async function appRoutes(app: FastifyInstance) {
  app.register(createAccount, { prefix: '/employees' })
  app.register(authenticate, { prefix: '/employees' })
  app.register(getProfile, { prefix: '/employees' })
  app.register(changePassword, { prefix: '/employees' })
  app.register(requestPasswordRecover, { prefix: '/employees' })
  app.register(resetPassword, { prefix: '/employees' })
  app.register(getAllEmployees, { prefix: '/employees' })
  app.register(inactiveEmployee, { prefix: '/employees' })
}

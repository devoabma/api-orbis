import type { FastifyInstance } from 'fastify'
import { createAccount } from './employees/create-account'

export async function appRoutes(app: FastifyInstance) {
  // Employee routes
  app.register(createAccount, { prefix: '/employees' })
}

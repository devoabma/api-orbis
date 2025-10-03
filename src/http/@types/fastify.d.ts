import 'fastify'

declare module 'fastify' {
  export interface FastifyRequest {
    getCurrentEmployeeId(): Promise<string>
    checkIfEmployeeIsAdmin(): Promise<void>
  }
}

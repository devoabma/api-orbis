import { fastifyCookie } from '@fastify/cookie'
import { fastifyCors } from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import { fastify } from 'fastify'
import { jsonSchemaTransform, serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod'
import { errorHandler } from './@errors'
import { env } from './env'
import { appRoutes } from './routes'

export const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.setErrorHandler(errorHandler) // configura o errorHandler global

// Configura o swagger para documentação da API
app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'API Orbis',
      description: 'API Orbis (Sala Livre) | Plataforma Integrada de Gestão de Espaços Tecnológicos',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        // bearerAuth nome definido para o securitySchemes no swagger
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    servers: [],
  },
  transform: jsonSchemaTransform,
})

app.register(fastifySwaggerUi, {
  routePrefix: '/docs', // rota para acessar a documentação
})

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
  cookie: {
    cookieName: '@orbis-auth',
    signed: false,
  },
})

app.register(fastifyCors)
app.register(fastifyCookie)
app.register(appRoutes)

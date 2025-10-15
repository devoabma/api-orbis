import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  API_PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.url('A variável DATABASE_URL é obrigatória'),
  ADMIN_PASS: z.string().min(6, 'A variável ADMIN_PASS é obrigatória'),
  ADMIN_CPF: z.string().min(11, 'A variável ADMIN_CPF é obrigatória'),
  JWT_SECRET: z.string('A variável JWT_SECRET é obrigatória'),
  DOMAIN_URL: z.string('A variável DOMAIN_URL é obrigatória').default('localhost'),
  WEB_URL: z.string('A variável WEB_URL é obrigatória').default('http://localhost:3000'),
  RESEND_API_KEY: z.string('A variável RESEND_API_KEY é obrigatória'),
  CLOUDINARY_API_KEY: z.string('A variável CLOUDINARY_API_KEY é obrigatória'),
  CLOUDINARY_API_SECRET: z.string('A variável CLOUDINARY_API_SECRET é obrigatória'),
  CLOUDINARY_CLOUD_NAME: z.string('A variável CLOUDINARY_CLOUD_NAME é obrigatória'),
})

const _env = envSchema.safeParse(process.env)

if (_env.success === false) {
  console.error('> Variáveis de ambiente inválidas, verifique o arquivo .env', _env.error.message)

  throw new Error('> Houve um erro ao carregar as variáveis de ambiente.')
}

export const env = _env.data

import { hash } from 'bcryptjs'
import { env } from '@/http/env'
import { prisma } from '@/lib/prisma'

async function main() {
  // FIXME: Senha padrão (altere em produção)
  const password = env.ADMIN_PASS
  const hashed = await hash(password, 6)

  const existingAdmin = await prisma.employees.findUnique({
    where: {
      cpf: env.ADMIN_CPF,
    },
  })

  if (existingAdmin) {
    console.log('> Administrador já existe no banco de dados')
    return
  }

  await prisma.employees.create({
    data: {
      name: 'Administrador Orbis',
      cpf: env.ADMIN_CPF,
      email: 'admin@fake.com.br',
      passwordHash: hashed,
      role: 'ADMIN',
    },
  })

  console.log('> Administrador criado com sucesso')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

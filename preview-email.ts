import { render } from '@react-email/components'
import { EmployeeSignUpEmail } from './src/utils/emails/employee-signup-email'

async function main() {
  const html = await render(
    EmployeeSignUpEmail({
      name: 'Hilquias Ferreira Melo',
      cpf: '123.456.789-00',
      email: 'hilquiasfmelo@gmail.com',
      tempPassword: '123456',
      link: 'https://sala-livre.vercel.app',
    })
  )

  console.log(html)
}

main()

// Execução
// pnpm tsx preview-email.ts > preview.html

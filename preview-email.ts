import { render } from '@react-email/components'
import { ResetPasswordEmail } from './src/utils/emails/reset-password-email'

async function main() {
  const html = await render(
    ResetPasswordEmail({
      name: 'Hilquias Ferreira Melo',
      code: '123456',
      link: 'https://sala-livre.vercel.app',
    })
  )

  console.log(html)
}

main()

// Execução
// pnpm tsx preview-email.ts > preview.html

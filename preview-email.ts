import { render } from '@react-email/components'
import { PasswordChangedEmail } from './src/utils/emails/password-changed-email'

async function main() {
  const html = await render(
    PasswordChangedEmail({
      name: 'Hilquias Ferreira Melo',
      link: 'https://sala-livre.vercel.app',
    })
  )

  console.log(html)
}

main()

// Execução
// pnpm tsx preview-email.ts > preview.html

import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Tailwind, Text } from '@react-email/components'
import * as React from 'react'

interface PasswordResetEmailProps {
  name: string
  code: string
  link: string
}

export const ResetPasswordEmail = ({ name, code, link }: PasswordResetEmailProps) => {
  const currentYear = new Date().getFullYear()
  const sendDate = new Date().toLocaleDateString('pt-BR')

  return (
    <Html>
      <Head />
      <Preview>Recebemos uma solicitação para redefinir a senha da sua conta no Sala Livre.</Preview>

      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto my-8 max-w-xl rounded-lg border border-gray-200 bg-white p-8">
            <Heading className="mb-6 text-center font-bold text-2xl text-blue-700">Redefinição de Senha - Sala Livre</Heading>

            <Text className="mb-6 text-gray-700">
              Olá, <b>{name}</b>
            </Text>

            <Text className="mb-6 text-gray-700">
              Recebemos uma solicitação para redefinir a senha da sua conta no
              <b> Sala Livre</b>. Use o código abaixo para concluir o processo de redefinição:
            </Text>

            <Section className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <Text className="text-center font-bold text-2xl text-blue-700 tracking-widest">{code}</Text>
            </Section>

            <Text className="mb-6 text-gray-700">
              Em seguida, clique no botão abaixo para acessar a página de redefinição e criar uma nova senha com segurança:
            </Text>

            <Button href={link} className="block rounded-lg bg-blue-600 px-6 py-3 text-center font-bold text-white">
              Redefinir Senha
            </Button>

            <Hr className="my-6 border-gray-200" />

            <Text className="text-center text-gray-500 text-sm">
              Se você não solicitou a redefinição de senha, por favor ignore este e-mail ou entre em contato com nosso suporte.
            </Text>

            <Hr className="my-6 border-gray-200" />

            <Text className="text-center text-gray-400 text-xs">
              &copy; {currentYear} Sala Livre. Todos os direitos reservados.
            </Text>
            <Text className="text-center text-gray-400 text-xs">Este e-mail foi enviado em {sendDate}.</Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

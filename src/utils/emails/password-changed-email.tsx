import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Tailwind, Text } from '@react-email/components'
import * as React from 'react'

interface PasswordChangedEmailProps {
  name: string
  link: string
}

export const PasswordChangedEmail = ({ name, link }: PasswordChangedEmailProps) => {
  const currentYear = new Date().getFullYear()
  const sendDate = new Date().toLocaleDateString('pt-BR')

  return (
    <Html>
      <Head />
      <Preview>Sua senha foi alterada com sucesso - Sala Livre</Preview>

      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto my-8 max-w-xl rounded-lg border border-gray-200 bg-white p-8">
            <Heading className="mb-6 text-center font-bold text-2xl text-blue-700">Senha alterada com sucesso!</Heading>

            <Text className="mb-6 text-gray-700">
              Olá, <b>{name}</b>
            </Text>

            <Text className="mb-6 text-gray-700">
              Informamos que sua senha de acesso ao sistema <b>Sala Livre</b> foi alterada com sucesso.
            </Text>

            <Section className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-center">
              <Text className="text-gray-700">Caso tenha sido você quem realizou a alteração, não é necessário fazer nada.</Text>
              <Text className="mt-2 text-gray-700">
                Se você <b>não reconhece</b> esta alteração, acesse imediatamente sua conta e redefina a senha novamente ou entre
                em contato com o suporte.
              </Text>
            </Section>

            <Section className="mb-8 text-center">
              <Button href={link} className="block rounded-lg bg-blue-600 px-6 py-3 text-center font-bold text-white">
                Acessar o Sistema
              </Button>
            </Section>

            <Hr className="my-6 border-gray-200" />

            <Text className="text-center text-gray-500 text-sm">
              Este é um e-mail automático. Por favor, não responda a esta mensagem.
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

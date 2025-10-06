import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Tailwind, Text } from '@react-email/components'
import * as React from 'react'

type EmployeeSignUpEmailProps = {
  name: string
  cpf: string
  email: string
  tempPassword: string
  link: string
}

export const EmployeeSignUpEmail = ({ name, cpf, email, tempPassword, link }: EmployeeSignUpEmailProps) => {
  const currentYear = new Date().getFullYear()
  const sendDate = new Date().toLocaleDateString('pt-BR')

  return (
    <Html>
      <Head />
      <Preview>Bem-vindo(a) ao Sala Livre! Confira os detalhes do seu cadastro.</Preview>

      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto my-8 max-w-xl rounded-lg border border-gray-200 bg-white p-8">
            <Heading className="mb-6 text-center font-bold text-2xl text-blue-700">Bem-vindo(a) ao Sala Livre!</Heading>

            <Text className="mb-6 text-gray-700">
              Olá, <b>{name}</b>
            </Text>
            <Text className="mb-6 text-gray-700">
              Estamos muito felizes em tê-lo(a) conosco! Abaixo estão os detalhes do seu cadastro:
            </Text>

            <Section className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <Text className="mb-2 text-gray-700">
                <b>Nome:</b> {name}
              </Text>
              <Text className="mb-2 text-gray-700">
                <b>CPF:</b> {cpf}
              </Text>
              <Text className="mb-2 text-gray-700">
                <b>E-mail:</b> {email}
              </Text>
              <Text className="text-gray-700">
                <b>Senha provisória:</b> {tempPassword}
              </Text>
            </Section>

            <Text className="mb-6 text-gray-700">
              Você está recebendo uma senha temporária para acessar o sistema Sala Livre. Por questões de segurança, é obrigatório
              que você realize a redefinição de senha após o primeiro login.
            </Text>

            <Button href={link} className="block rounded-lg bg-blue-600 px-6 py-3 text-center font-bold text-white">
              Acessar o Sistema
            </Button>

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

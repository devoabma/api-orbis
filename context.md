### Orbis (Sala Livre)

O **SalaLivre** é uma plataforma integrada de gestão de espaços tecnológicos voltada para os escritórios compartilhados e salas de fórum da **OAB Maranhão**.

## 💻 Fluxo da Aplicação SalaLivre
### 1. **Acesso do Advogado (App Desktop / Pyhton)**
1. O  aplicativo **SalaLivre já estará em execução** no computador da sala.
2. Na tela de login, ele **informa CPF, data de nascimento e número da OAB**.
3. O sistema valida se o advogado esta adimplente na API do Protheus.
4. O sistema valida os dados contra a tabela `lawyers` se existe beleza, senao cria um novo registro.
5. Se os dados estiverem corretos:
    - O computador é liberado para uso (`released = true` ).
    - O sistema registra o **tempo padrão de uso** da sala (`rooms.standard_time` ) e pode iniciar um **timer** de controle de sessão.

6. Durante o uso, o advogado pode:
    - Navegar na internet, usar softwares da máquina ou enviar **arquivos para impressão**.
    - Ao enviar um arquivo, o sistema cria um registro na tabela `printers` 
        - `lawyer_id`  → identifica o advogado.
        - `computer_id`  → identifica o computador usado.
        - `url_file`  → caminho para o arquivo enviado.
        - `created_at`  → timestamp do envio.


---

### 2. **Gestão de Funcionários (Web / Frontend Next.js)**
1. Cada funcionário tem acesso ao **painel web**, autenticando com `employees` .
2. O funcionário está vinculado a **uma ou mais salas** via `employees_rooms` 
3. No painel, ele pode:
    - Visualizar **computadores da(s) sala(s) que gerencia**.
        - Status do computador (`released` , `maintenance` ).

    - Acompanhar **advogados usando os computadores em tempo real**.
    - O funcionário poderá liberar o computador para o advogado de forma manual caso precise.
    - Ver a lista de **arquivos enviados para impressão** (`printers` ) e baixar os arquivos para impressão física.

---

### 3. **Controle de Salas e Computadores**
- Cada **sala (**`**rooms**` **)** possui:
    - `standard_time`  → tempo padrão de uso de cada advogado.
    - `remening_time`  → tempo restante da sessão (opcional, pode ser usado pelo desktop para exibir contador).

- Cada **computador (**`**computers**` **)** possui:
    - `room_id`  → vínculo com a sala.
    - `released`  → indica se está liberado ou bloqueado.
    - `maintenance`  → indica se o computador está fora de operação.

- O sistema deve impedir que computadores em **manutenção** sejam liberados.
---

### 4. **Fluxo de Impressão**
1. O advogado envia um arquivo pelo app desktop → cria registro em `printers` .
2. O funcionário da sala acessa o painel web → vê os arquivos pendentes.
3. O funcionário baixa o arquivo e realiza a impressão.
4. Opcionalmente, o status do arquivo pode ser atualizado (`downloaded_at`  / `printed_at` ).
---

### 5. **Administração e Relatórios**
- **Funcionários com papel **`**ADMIN**`  podem:
    - Cadastrar novas salas (`rooms` ).
    - Cadastrar ou gerenciar computadores (`computers` ).
    - Cadastrar e vincular funcionários a salas (`employees_rooms` ).

- O sistema pode gerar relatórios:
    - Uso de cada sala e computador.
    - Quantidade de impressões por advogado e sala.
    - Tempo médio de uso por sessão.

---

### 🔑 Observações do Fluxo
- A **tabela **`**employees_rooms**`  garante que cada funcionário veja apenas os computadores das salas que gerencia.
- A **tabela **`**computers**`  controla a liberação física e manutenção dos computadores.
- A **tabela **`**printers**`  mantém rastreio completo de arquivos enviados para impressão, associando **advogado + computador + sala** indiretamente.
- A autenticação do advogado é **simples, mas segura**, baseada em CPF, OAB e data de nascimento.


### Logíca de Diagramação do Banco de Dados
- Funcionário e Salas
    - [ ] Um funcionário pode pertencer a várias salas e uma sala poderá ser acessada por um ou vários funcionários. (Many to Many)

- Salas e Computadores
    - [ ] Uma sala tem vários computadores, cada computador pertence a apenas uma sala (One to Many)

- Impressão, Computador e Advogado
    - [ ] Cada impressão é enviada por um advogado e realizada em um computador específico.
    - [ ] Um computador pode ter várias impressões associadas.
    - [ ] Um advogado pode enviar várias impressões. (**Many to One / One to Many**)Implementado pelas chaves estrangeiras `computer_id`   e `lawyer_id`   na tabela `printers`.

---

## Atores
1. Funcionários (employees)
2. Salas (rooms)
3. Computadores (computers)
4. Impressoras (printers)
5. Advogados (lawyers)
---

### RFs (Requisitos Funcionais)
1. Funcionários (Employees)
    - [x] Criar seed do usuário administrador master (para permissão de criação de funcionários e salas)
    - [x] Deve ser possivel cadastrar funcionários
    - [x] Deve ser possível autenticar
    - [x] Deve ser possível obter o perfil de um usuário logado
    - [x] Deve ser possível trocar de senha
    - [x] Deve ser possível redefinir a senha
    - [x] Deve ser possível enviar um email para refinir senha
    - [x] Deve ser possível enviar um email para o funcionário quando o adm cadastrá-lo
    - [x] Deve ser possível listar todos os funcionários cadastrados
    - [x] Deve ser possível inativar um funcionário
    - [x] Deve ser possível ativar um funcionário
    - [x] Deve ser possível alterar um funcionário
    - [x] Deve ser possível trocar a foto de perfil do funcionário logado
    - [x] Deve ser possível vincular um funcionário a uma ou várias salas 
    - [x] Deve ser possível desvincular um funcionário de uma ou várias salas
    - [x] Nao deve ser possível vincular um funcionário a uma sala inativa

2. Salas (Rooms)
    - [x] Deve ser possivel criar um sala
    - [x] Deve ser possivel buscar todas as salas
    - [x] Deve ser possível editar uma sala
    - [x] Deve ser possível inativar uma sala
    - [x] Deve ser possivel ativar uma sala

3. Computadores (Computers)
    - [x] Deve ser possivel cadastrar computadores
    - [x] Deve ser possível editar computadores
    - [x] Deve ser possível excluir computadores
    - [x] Deve ser possível colocar o computador em manutenção
    - [x] Deve ser possível tirar um computador de manutenção

4. Advogados (Lawyers)
    - [x] Deve ser possível um advogado realizar a solicitação para o uso do computador em uma determinada sala
    - [x] Criar cron job que verificarar sessẽes encerradas dos advogados e liberará o computador
    - [x] Deve ser possível o advogado cancelar sua sessão
    - [x] Deve ser possível o advogado continuar sua sessão de onde parou, no mesmo dia somente
    - [ ] Deve ser possível buscar todas as sessões

### RNs (Regras de Negócio)
1. Funcionários (Employees)
    - [x] Somente administradores podem cadastrar funcionários/salas/computadores
    - [x] O administrador nao pode cadastrar funcionários com e-mail e cpf duplicado
    - [x] O funcionário não poderá alterar a senha se a informada for a antiga
    - [x] Somente administradores podem ver todos os funcionários cadastrados
    - [x] Somente administradores podem inativar um funcionário
    - [x] Somente administradores podem ativar um funcionário
    - [x] Somente administradores podem alterar um funcionário
    - [x] O funcionário nao pode se autenticar se ele estiver inativo
    - [x] Somente administradores podem criar salas
    - [x] Somente administradores podem editar salas
    - [x] Somente administradores podem inativar uma sala
    - [x] Somente administradores podem ativar uma sala
    - [x] Somente administradores podem cadastrar computadores
    - [x] Somente administradores podem editar computadores
    - [x] Somente administradores podem excluir computadores
    - [x] Se o advogado existe (`Lawyers` ).
    - [x] Se o computador existe e **não está em uso** (`Computers.inUse === false`  ).
    - [x] Se o advogado tem tempo restante (`Lawyers.remainingTime > 0`  ).
    - [x] Se o computador pertence a uma sala ativa (`Rooms.inactive === null`  ).
    - [x] O advogado nao pode ter duas sessões ao mesmo tempo
    - [x] Os dados vindos da API não podem ser editados
    - [x] Nao é possível liberar computador de uma sala inativa
    - [x] Não é possível liberar computador em manutenção
    - [x] Não é possível liberar um computador que já esta em uso
    - [x] Não é possível o advogado acessar no mesmo dia se o tempo dele acabou
    - [x] Quando o advogado cancelar sua sessao, guardar o tempo restante
    - [x] O advogado so poderá usar o tempo restante se ainda tiver no mesmo dia
    - [x] O advogado so poderá liberar um computador se estiver adimplente
    - [ ] Somente administradores podem emitir relatórios

### RNFs (Requisitos não-funcionais)
1. Funcionários (Employees)
    - [x] A senha do usuário precisa estar criptografada;
    - [x] Os dados da aplicação precisam estar persistidos em um banco PostgreSQL
    - [x] O administrador e usuário deve ser identificado por um JWT
    - [x] Assim que o administrador cadastrar um funcionário, o mesmo receberá um e-mail de confirmação, contendo seus dados
    - [x] A consulta dos dados dos advogados virão de uma API externa
    - [ ] Todo o histórico de salas, computadores, advogados, impressoões e funcionários precisam esta paginados com 10 itens por página




# Node Tetris
Implementação do famoso game tetris para jogar multiplayer, com a intenção e praticar conceitos de comunicação via `websockets` e renderização de GUI no elemento `<canvas>` a partir de `javascript` sem o uso de engines e frameworks. 

## Como Funciona?
- [Backend](#backend)
- [Frontend](#frontend)
- [Instalação em Ambiente de Desenvolvimento](#instalação-em-ambiente-de-desenvolvimento)
- [Protocolo de Mensagens](#protocolo-de-mensagens)

## **Backend**
O servidor do game é escrito em `javascript` com `Node.js` e concentra a comunicação entre aplicações clientes, onde os jogadores poderão criar disputas entre si.

A comunicação é feita com `websockets`, utilizando um protocolo de comunicação exclusivo deste game, criado para troca de mensagens entre os clientes e o servidor.

## **Frontend**
A parte visual deste game usa `javascript` puro e é renderizada no elemento `<canvas>` do HTML sem usar nenhum framework adicional.

## **Instalação em Ambiente de Desenvolvimento**
Os passos a seguir, levam em consideração que você já tenha o Node.js instalado em sua máquina, e esteja dentro da pasta do projeto.
### Subindo o Servidor
Instale as dependências na primeira execução:
````bash
cd backend
npm install
````
 Em seguida inicialize o servidor
````bash
npm run dev
````
### Inicializando o Frontend
Instale as dependências na primeira execução:
````bash
cd frontend
npm install
````
 Em seguida, abra o arquivo `.env` na raiz do projeto frontend e edite-o com substituindo o valor da variável `SERVER_IP` pelo IP do computador que estiver exevutando o servidor para que possa ser acessado por qualquer computador da sua rede, como no exemplo a seguir:
 ````bash
 SERVER_IP=192.168.0.105
 ````
 Agora, inicialize a interface gráfica que poderá ser acessada em um navegador no endereço padrão http://localhost:5000.
````bash
npm start
````
## **Protocolo de Mensagens**
1. A conexão com o servidor começa enviando um pacote de registro:
````js
{
    'type':  'Register',
    'name': 'Player 1'
}
````
2. O servidor responde a mensagem de registro com a ID do usuário registrado e com a lista de usuários conectados:

````js
{
    'type': 'Register',
    'name': 'Player 1',
    'uid': '1b68695c-0e0e',
    'success': true
}
````

````js
{
    'type': 'PlayersList',
    'players': [
        {
            'uid': '52f261f3-a6e8',
            'name': 'Player 1'
        },
        {
            'uid': '1b68695c-0e0e',
            'name': 'Player 2'
        }
    ]
}
````

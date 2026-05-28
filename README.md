````md
<h1 align="center">
 Projeto WhatsApp Clone
</h1>

<p align="center">
 Clone do WhatsApp Web desenvolvido com JavaScript, Firebase e arquitetura Client-Server.
</p>

<p align="center">

<img src="https://img.shields.io/badge/Node.js-16.20.2-339933?style=for-the-badge&logo=node.js&logoColor=white"/>

<img src="https://img.shields.io/badge/Express.js-Backend-000000?style=for-the-badge&logo=express&logoColor=white"/>

<img src="https://img.shields.io/badge/Firebase-Realtime-orange?style=for-the-badge&logo=firebase"/>

<img src="https://img.shields.io/badge/JavaScript-ES6-yellow?style=for-the-badge&logo=javascript"/>

<img src="https://img.shields.io/badge/Status-Em%20Desenvolvimento-success?style=for-the-badge"/>

</p>

---

## Preview do Projeto

<p align="center">
  <img src="./img/teste-wpp.gif" alt="Demonstração do projeto" width="1000"/>
</p>

---

## Sobre o Projeto

Aplicação desenvolvida utilizando arquitetura **Client-Server** com Node.js, integração com Firebase e renderização dinâmica de componentes.

O sistema simula funcionalidades presentes no WhatsApp Web, incluindo:

- autenticação;
- envio de mensagens;
- upload de arquivos;
- captura de áudio;
- comunicação em tempo real;
- armazenamento em nuvem.

---

## Funcionalidades

✔️ Login e autenticação com Firebase  
✔️ Envio de mensagens em tempo real  
✔️ Upload de imagens  
✔️ Upload de áudio  
✔️ Compartilhamento de PDFs  
✔️ Captura de áudio via microfone  
✔️ Atualização dinâmica das conversas  
✔️ Cloud Firestore  
✔️ Firebase Storage  
✔️ Cloud Functions  
✔️ Interface inspirada no WhatsApp Web  
✔️ Renderização dinâmica  
✔️ Estrutura Client-Server  

---

## Arquitetura da Aplicação

O projeto foi estruturado utilizando o padrão:

```txt
Client → API REST → Firebase Services
````

Dividido entre:

* Front-End responsável pela renderização dinâmica;
* Back-End Node.js com Express;
* API REST separada;
* Firebase Authentication;
* Cloud Firestore;
* Firebase Storage;
* Cloud Functions.

---

## Tecnologias Utilizadas

| Tecnologia              | Descrição               |
| ----------------------- | ----------------------- |
| JavaScript              | Linguagem principal     |
| Node.js                 | Ambiente de execução    |
| Express.js              | Servidor Backend        |
| Firebase Authentication | Autenticação            |
| Cloud Firestore         | Banco de dados realtime |
| Firebase Storage        | Upload de arquivos      |
| Cloud Functions         | Funções serverless      |
| Webpack                 | Build da aplicação      |
| PDF.js                  | Visualização de PDFs    |
| MediaDevices API        | Captura de áudio        |

---

## 📂 Estrutura do Projeto

```bash
Projeto-Whatsapp/
│
├── audio/
├── css/
├── dist/
├── functions/
├── img/
├── js/
├── node_modules/
├── package.json
├── firebase.json
└── webpack.config.js
```

---

## Como Executar o Projeto

> Este projeto foi desenvolvido utilizando exclusivamente o **Node.js v16.20.2**.
>
> Recomenda-se utilizar exatamente esta versão para evitar incompatibilidades de dependências e erros durante a execução.

---

### Instale o Node.js

🔗 https://nodejs.org/dist/v16.20.2/

---

### 1. Clone o repositório

```bash
git clone https://github.com/lucasescouto-ux/Projeto-Whatsapp.git
```

---

### 2. Acesse a pasta do projeto

```bash
cd Projeto-Whatsapp
```

---

### 3. Instale as dependências

```bash
npm install
```

---

### 4. Execute o projeto

```bash
npm start
```

---

## Configuração Firebase

Para executar corretamente o projeto é necessário configurar:

* Firebase Authentication
* Cloud Firestore
* Firebase Storage
* Cloud Functions

Crie um projeto no Firebase e adicione suas credenciais no arquivo de configuração da aplicação.

---

## Scripts Disponíveis

| Script         | Descrição         |
| -------------- | ----------------- |
| npm start      | Inicia o servidor |
| npm run build  | Build de produção |
| npm test       | Executa testes    |
| npm run serve  | Emulador Firebase |
| npm run deploy | Deploy Functions  |
| npm run logs   | Logs das funções  |

---

## Recursos Utilizados

| Recurso          | Link                                                                       |
| ---------------- | -------------------------------------------------------------------------- |
| Webpack          | https://webpack.js.org/                                                    |
| Firebase Docs    | https://firebase.google.com/docs                                           |
| PDF.js           | https://mozilla.github.io/pdf.js/                                          |
| MediaDevices API | https://developer.mozilla.org/pt-BR/docs/Web/API/MediaDevices/getUserMedia |

---

## Aprendizados

Durante o desenvolvimento deste projeto foram aprofundados conhecimentos em:

* Arquitetura Client-Server;
* Node.js;
* Firebase;
* Renderização dinâmica;
* Manipulação de arquivos;
* Upload de mídia;
* Comunicação em tempo real;
* Estruturação de aplicações escaláveis;
* Integração Front-End e Back-End.

---

## Status do Projeto

✅ Projeto funcional
🚀 Em constante evolução

---

## Autor

Projeto desenvolvido para Trilha - Saipos

```
```

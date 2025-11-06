# NFS-e SaaS - Sistema de Emissão de Notas Fiscais de Serviço

Sistema web desenvolvido em React para emissão e gerenciamento de NFS-e (Notas Fiscais de Serviço Eletrônicas) integrado com a API da Technospeed (PlugNotas).

## 🚀 Funcionalidades

- ✅ **Listar NFS-e**: Visualize todas as notas fiscais emitidas
- ✅ **Criar NFS-e**: Emita novas notas fiscais de serviço
- ✅ **Consultar NFS-e**: Visualize detalhes completos de cada nota
- ✅ **Download PDF**: Baixe a NFS-e em formato PDF
- ✅ **Download XML**: Baixe a NFS-e em formato XML
- ✅ **Cancelar NFS-e**: Cancele notas fiscais emitidas
- ✅ **Enviar por Email**: Envie a NFS-e por email para o tomador

## 🛠️ Tecnologias Utilizadas

- **React 19** - Framework JavaScript para construção da interface
- **Vite** - Build tool e dev server
- **React Router DOM** - Gerenciamento de rotas
- **Axios** - Cliente HTTP para consumo da API
- **CSS3** - Estilização responsiva

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Chave de API da Technospeed (PlugNotas)

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/FiveTech-Solutions/5saas.git
cd 5saas
```

2. Instale as dependências:
```bash
npm install
```

3. Configure sua chave de API:
   - Acesse a aplicação
   - Vá para "Configurações" no menu
   - Insira sua chave de API da Technospeed

## 🚀 Execução

### Modo de Desenvolvimento
```bash
npm run dev
```
Acesse: `http://localhost:5173`

### Build para Produção
```bash
npm run build
```

### Preview da Build de Produção
```bash
npm run preview
```

### Linting
```bash
npm run lint
```

## 🌐 Integração com API Technospeed

O sistema utiliza os seguintes endpoints da API PlugNotas (Sandbox):

- `POST /nfse` - Criar nova NFS-e
- `GET /nfse/{idNotaOrProtocol}` - Consultar NFS-e
- `GET /nfse/pdf/{idNota}` - Baixar PDF
- `GET /nfse/xml/{idNota}` - Baixar XML
- `POST /nfse/cancelar/{idNota}` - Cancelar NFS-e
- `POST /nfse/email/{idNota}` - Enviar por email

**Base URL**: `https://api.sandbox.plugnotas.com.br`

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── Header.jsx      # Cabeçalho da aplicação
│   └── NFSeCard.jsx    # Card de exibição de NFS-e
├── pages/              # Páginas da aplicação
│   ├── Home.jsx        # Listagem de NFS-e
│   ├── NewNFSe.jsx     # Formulário de criação
│   ├── NFSeDetails.jsx # Detalhes e ações da NFS-e
│   └── Settings.jsx    # Configurações da API
├── services/           # Serviços de integração
│   ├── api.js         # Configuração do Axios
│   └── nfseService.js # Métodos de API da NFS-e
└── utils/             # Utilitários
    └── helpers.js     # Funções auxiliares
```

## 🎨 Features da Interface

- Design responsivo e moderno
- Feedback visual para todas as ações
- Estados de loading e erro tratados
- Modais para ações críticas (cancelamento, envio de email)
- Indicadores visuais de status das notas
- Download automático de arquivos (PDF/XML)

## 🔒 Segurança

- A chave de API é armazenada localmente no navegador (localStorage)
- Todas as requisições incluem a chave de API no header `x-api-key`
- Ambiente sandbox para testes seguros

## 📱 Responsividade

O sistema é totalmente responsivo e funciona em:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte e documentação da API Technospeed, visite:
- [Documentação PlugNotas](https://docs.plugnotas.com.br)
- [Portal do Desenvolvedor](https://api.plugnotas.com.br)

## ✨ Autor

Desenvolvido por FiveTech Solutions


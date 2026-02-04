# 🚀 Velo - Gestão de Projetos

<p align="center">
  <img src="https://img.shields.io/badge/Angular-17-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular 17"/>
  <img src="https://img.shields.io/badge/NestJS-10-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS"/>
  <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite"/>
</p>

**Velo** (do italiano, "velocidade") é um sistema moderno de gestão de projetos estilo Kanban, desenvolvido com foco em **performance**, **interatividade** e **experiência do usuário**.


## ✨ Características

### 🎯 Funcionalidades
- **Kanban Board Interativo** - Drag & drop fluido com otimistic updates
- **Projetos e Boards** - Organize tarefas em múltiplos boards por projeto
- **Tarefas Ricas** - Tipos, prioridades, tags, story points, datas de entrega
- **WIP Limits** - Controle de work-in-progress por coluna
- **Busca em Tempo Real** - Filtragem instantânea de tarefas
- **Estatísticas Live** - Contadores atualizados via Angular Signals

### 🛠 Diferenciais Técnicos

#### Frontend (Angular 17)
- **Signals** - Gerenciamento de estado reativo e ultra-performático
- **RxJS** - Streams de dados assíncronos com operadores avançados
- **CDK Drag & Drop** - Arrastar e soltar nativo do Angular
- **Reactive Forms** - Formulários com validações customizadas
- **Standalone Components** - Arquitetura moderna sem NgModules

#### Backend (NestJS 10)
- **TypeORM** - ORM com suporte a SQLite e migrações
- **Class Validator** - DTOs com validação automática
- **Swagger** - Documentação automática da API
- **Repository Pattern** - Separação clara de responsabilidades

## 📁 Estrutura do Projeto

```
velo/
├── frontend/                 # Angular 17+
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/        # Services, models, interceptors
│   │   │   ├── shared/      # Componentes compartilhados
│   │   │   └── features/    # Módulos de funcionalidades
│   │   │       ├── projects/
│   │   │       └── board/
│   │   ├── environments/
│   │   └── styles.scss      # Design system
│   └── package.json
│
├── backend/                  # NestJS 10
│   ├── src/
│   │   ├── modules/
│   │   │   ├── projects/
│   │   │   ├── boards/
│   │   │   ├── columns/
│   │   │   └── tasks/
│   │   ├── common/
│   │   └── main.ts
│   └── package.json
│
└── README.md
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Backend

```bash
cd backend
npm install
npm run start:dev
```

O servidor iniciará em `http://localhost:3000`
Documentação Swagger: `http://localhost:3000/docs`

### Frontend

```bash
cd frontend
npm install
npm start
```

A aplicação iniciará em `http://localhost:4200`

## 🎨 Design System

### Paleta de Cores

| Nome | Hex | Uso |
|------|-----|-----|
| Background Primary | `#0D0D0F` | Fundo principal |
| Background Secondary | `#141418` | Cards, sidebar |
| Accent | `#FF6B4A` | Ações, destaques |
| Text Primary | `#F5F5F7` | Texto principal |
| Text Secondary | `#A1A1A6` | Texto secundário |

### Tipografia
- **Família**: Outfit (Google Fonts)
- **Monospace**: JetBrains Mono

## 📚 API Endpoints

### Projects
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/projects` | Listar projetos |
| GET | `/api/projects/:id` | Buscar projeto |
| POST | `/api/projects` | Criar projeto |
| PATCH | `/api/projects/:id` | Atualizar projeto |
| DELETE | `/api/projects/:id` | Remover projeto |

### Boards
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/boards` | Listar boards |
| GET | `/api/boards/:id` | Buscar board |
| POST | `/api/boards` | Criar board |
| PATCH | `/api/boards/:id` | Atualizar board |
| DELETE | `/api/boards/:id` | Remover board |

### Tasks
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/tasks` | Listar tarefas |
| GET | `/api/tasks/:id` | Buscar tarefa |
| POST | `/api/tasks` | Criar tarefa |
| POST | `/api/tasks/:id/move` | Mover tarefa (D&D) |
| PATCH | `/api/tasks/:id` | Atualizar tarefa |
| DELETE | `/api/tasks/:id` | Remover tarefa |

## 🔧 Configuração

### Variáveis de Ambiente (Backend)

```env
PORT=3000
NODE_ENV=development
```

### Configuração do Frontend

Edite `frontend/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
};
```

## 📝 Arquitetura

### Fluxo de Dados (Frontend)

```
Component → Service (Signal) → HTTP → API
                ↓
            BehaviorSubject → Template (async pipe)
                ↓
            Computed Signal → Derived State
```

### Padrões Utilizados

1. **Repository Pattern** - Abstração do acesso a dados
2. **DTO Pattern** - Transferência de dados tipada
3. **Service Layer** - Lógica de negócio isolada
4. **Reactive State** - Estado reativo com Signals/RxJS

## 🧪 Validações Customizadas

O projeto inclui validadores personalizados:

```typescript
// Tags Validator - máximo 10 tags, cada uma com até 20 caracteres
function tagsValidator(control: AbstractControl): ValidationErrors | null

// Future Date Validator - data não pode ser no passado
function futureDateValidator(control: AbstractControl): ValidationErrors | null
```

## 📈 Performance

- **Otimistic Updates** - UI atualiza antes da resposta do servidor
- **Lazy Loading** - Rotas carregadas sob demanda
- **OnPush Strategy** - Change detection otimizado
- **Signals** - Reatividade fine-grained

## 👤 Autor

**Guilherme Salles**

---

<p align="center">
  Desenvolvido com ☕ e 🎵
</p>

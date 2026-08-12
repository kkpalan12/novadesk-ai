Perfect. Your current README is basically empty, so this is a good time to replace it with a proper **portfolio + production documentation README**.

We should document only what we've actually built and verified.

## Replace `README.md` completely

````md
# NovaDesk AI

> A production-ready full-stack project management platform built with Angular, Node.js, Express, MongoDB, and TypeScript.

NovaDesk AI is a collaborative project management application designed around workspaces, projects, tasks, team members, notifications, comments, activities, and file attachments.

The application supports multi-user collaboration with workspace-level membership and authorization.

---

## 🚀 Live Demo

### Frontend

https://novadesk-ai-1.onrender.com

### Backend API

https://novadesk-ai-p57p.onrender.com

### API Documentation

https://novadesk-ai-p57p.onrender.com/api-docs/

---

# ✨ Features

## Authentication

- User registration
- User login
- JWT authentication
- Access token handling
- Refresh token flow
- Current-user endpoint
- Logout
- Protected routes
- Authentication middleware

## Workspaces

- Create workspaces
- Workspace selection
- Workspace ownership
- Workspace members
- Workspace-level access control
- Multiple workspace support

## Membership Management

Workspace owners can:

- Add members
- Change member roles
- Remove members

Supported roles:

- `ADMIN`
- `MEMBER`

Supported membership states:

- `ACTIVE`
- `REMOVED`

Members can view workspace members but cannot perform owner-level membership operations.

## Projects

- Create projects
- View projects
- Update projects
- Delete projects
- Workspace-scoped projects

## Tasks

- Create tasks
- View tasks
- Update tasks
- Delete tasks
- Task status management
- Priority management
- Due dates
- Task assignment
- Task detail view
- Pagination
- Search
- Status filtering
- Priority filtering

Task statuses:

- `TODO`
- `IN_PROGRESS`
- `REVIEW`
- `DONE`

Task priorities:

- `LOW`
- `MEDIUM`
- `HIGH`
- `CRITICAL`

## Notifications

- Task assignment notifications
- Notification list
- Read/unread state
- Notification navigation
- Cross-user notification flow

## Comments

- Add comments to tasks
- View comments
- Persist comments across refreshes

## Activities

The application records task-related activity for collaborative workflows.

## Attachments

- Upload task attachments
- Store attachment metadata
- Attachment listing
- Attachment URLs

> Production note: the current deployment uses local filesystem storage for uploaded files. Persistent object storage is planned for the next production-hardening phase.

---

# 🏗️ Architecture

NovaDesk AI follows a separated client/server architecture.

```text
                    ┌─────────────────────┐
                    │      Angular       │
                    │      Client        │
                    └──────────┬──────────┘
                               │
                               │ REST API
                               ▼
                    ┌─────────────────────┐
                    │   Express / Node.js │
                    │      Backend        │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
          MongoDB          JWT Auth        File Storage
          Atlas
```
````

The backend is organized into layers such as:

```text
Routes
  ↓
Controllers
  ↓
Services
  ↓
Repositories
  ↓
Models / Entities
  ↓
MongoDB
```

The Angular application uses:

```text
Components
  ↓
Services
  ↓
API Service
  ↓
REST API
```

---

# 🛠️ Tech Stack

## Frontend

- Angular
- TypeScript
- Angular Material
- SCSS
- RxJS
- Signals

## Backend

- Node.js
- Express
- TypeScript
- Mongoose
- MongoDB Atlas
- JWT
- Zod
- Express Validator
- Multer
- Socket.IO
- Pino

## Testing

- Jest
- ts-jest
- Supertest
- MongoDB Memory Server

## Deployment

- Render
- MongoDB Atlas

---

# 📁 Project Structure

```text
novadesk-ai/
│
├── client/
│   ├── src/
│   │   └── app/
│   │       ├── core/
│   │       ├── features/
│   │       └── ...
│   │
│   └── angular.json
│
├── server/
│   ├── src/
│   │   ├── common/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── interfaces/
│   │   ├── mappers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── tests/
│   │   ├── types/
│   │   ├── utils/
│   │   └── validators/
│   │
│   └── package.json
│
├── docs/
│
└── README.md
```

---

# 🔐 Authentication Flow

NovaDesk uses JWT-based authentication.

```text
User
 │
 ▼
Login
 │
 ▼
Backend validates credentials
 │
 ▼
Access Token + Refresh Token
 │
 ▼
Angular stores authentication state
 │
 ▼
Protected API requests
 │
 ▼
Authentication Middleware
 │
 ▼
Authorized Resource
```

Protected resources verify the authenticated user before allowing access.

---

# 👥 Workspace Authorization

Workspace access is membership-based.

```text
Workspace
│
├── Owner
│   ├── Add members
│   ├── Change roles
│   └── Remove members
│
├── ADMIN
│
└── MEMBER
    └── Access permitted workspace resources
```

Authorization is enforced on the backend rather than relying only on frontend visibility.

This prevents unauthorized users from bypassing UI restrictions by calling the API directly.

---

# 🔄 Collaboration Flow

Example task collaboration flow:

```text
User A
  │
  ├── Creates task
  │
  ├── Assigns task to User B
  │
  ▼
Backend
  │
  ├── Saves task assignment
  │
  └── Creates notification
  │
  ▼
User B
  │
  ├── Receives notification
  │
  ├── Opens notification
  │
  ├── Opens task
  │
  └── Updates task
```

This flow has been tested successfully against the deployed application.

---

# ⚙️ Local Development

## Prerequisites

Install:

- Node.js
- npm
- MongoDB

MongoDB Atlas can also be used for development.

---

## Clone Repository

```bash
git clone https://github.com/kkpalan12/novadesk-ai.git

cd novadesk-ai
```

---

# 🖥️ Backend Setup

```bash
cd server

npm install
```

Create:

```text
server/.env
```

Example:

```env
NODE_ENV=development

PORT=5000

MONGO_URI=mongodb://localhost:27017/novadesk_ai

JWT_SECRET=your_access_token_secret_at_least_32_characters

JWT_REFRESH_SECRET=your_refresh_token_secret_at_least_32_characters

JWT_EXPIRES_IN=1d

JWT_REFRESH_EXPIRES_IN=7d

LOG_LEVEL=info

API_URL=http://localhost:5000/api/v1
```

Start development server:

```bash
npm run dev
```

Backend:

```text
http://localhost:5000
```

Swagger:

```text
http://localhost:5000/api-docs/
```

---

# 🌐 Frontend Setup

```bash
cd client

npm install
```

Start Angular development server:

```bash
npm start
```

Frontend:

```text
http://localhost:4200
```

---

# 🏗️ Production Build

## Backend

```bash
cd server

npm run build
```

Start:

```bash
npm start
```

## Frontend

```bash
cd client

npm run build
```

Production output:

```text
client/dist/client
```

---

# 🧪 Testing

Backend tests:

```bash
cd server

npm test
```

Watch mode:

```bash
npm run test:watch
```

Coverage:

```bash
npm run test:coverage
```

Unit tests:

```bash
npm run test:unit
```

Integration tests:

```bash
npm run test:integration
```

---

# 📚 API Documentation

Swagger documentation is available at:

[https://novadesk-ai-p57p.onrender.com/api-docs/](https://novadesk-ai-p57p.onrender.com/api-docs/)

The API is organized around:

```text
Authentication
Workspace
Membership
Projects
Tasks
Comments
Attachments
Notifications
Activities
```

---

# 🌍 Production Environment

The application is deployed using:

```text
Angular
   ↓
Render

Node.js / Express
   ↓
Render

MongoDB
   ↓
MongoDB Atlas
```

Production services:

```text
Frontend
https://novadesk-ai-1.onrender.com

Backend
https://novadesk-ai-p57p.onrender.com

Swagger
https://novadesk-ai-p57p.onrender.com/api-docs/
```

---

# 🔒 Environment Variables

Production secrets must be supplied through the deployment platform.

Never commit:

```text
.env
JWT secrets
MongoDB credentials
API keys
```

The repository ignores `.env` files.

---

# 📌 Current Production Status

Core application workflows have been manually verified against the deployed application.

| Feature                       | Status     |
| ----------------------------- | ---------- |
| Authentication                | ✅         |
| JWT / Refresh Token           | ✅         |
| Workspace Management          | ✅         |
| Membership Management         | ✅         |
| Authorization                 | ✅         |
| Projects                      | ✅         |
| Tasks CRUD                    | ✅         |
| Task Assignment               | ✅         |
| Notifications                 | ✅         |
| Comments                      | ✅         |
| Activities                    | ✅         |
| Angular Production Build      | ✅         |
| Backend Production Build      | ✅         |
| MongoDB Atlas                 | ✅         |
| Swagger API                   | ✅         |
| SPA Refresh                   | ✅         |
| Attachment Upload             | ✅         |
| Persistent Attachment Storage | ⚠️ Planned |

---

# 🚧 Future Improvements

Potential future improvements include:

- Persistent object storage for attachments
- Enhanced real-time collaboration
- Advanced search
- Dashboard analytics
- Email notifications
- Role/permission expansion
- Automated CI/CD
- Additional frontend test coverage
- Production observability and monitoring

---

# 🎯 Project Goals

NovaDesk AI was built to demonstrate production-oriented full-stack development using:

- Angular
- Node.js
- Express
- MongoDB
- TypeScript
- REST APIs
- JWT authentication
- Role-based authorization
- Multi-user collaboration
- Testing
- Cloud deployment

The project emphasizes maintainable architecture, clear separation of concerns, secure API access, and real-world collaborative workflows.

---

# 👨‍💻 Author

**Karthik Palan**

Full Stack Developer

Built with:

```text
Angular + Node.js + Express + MongoDB + TypeScript
```

---

## License

ISC

```

```

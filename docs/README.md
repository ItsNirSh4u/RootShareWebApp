# RootShare 🌱

A social platform for urban gardeners and plant enthusiasts to document plant growth, share collections, and trade cuttings with the community.

## Project Structure

This is a monorepo using [Turborepo](https://turbo.build) with pnpm workspaces:

```
rootshare/
├── apps/
│   ├── api/          # NestJS backend API
│   └── web/          # React frontend (Vite + TailwindCSS)
├── packages/
│   └── shared-types/ # Shared TypeScript types
├── docs/             # Project documentation
└── scripts/          # Utility scripts
```

## Tech Stack

### Backend (NestJS)
- **Framework**: NestJS with TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with refresh tokens
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest (unit tests)
- **Validation**: class-validator + class-transformer

### Frontend (React)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS + shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Testing**: Vitest + Playwright (E2E)

### Infrastructure
- **Monorepo**: Turborepo
- **Package Manager**: pnpm
- **Database**: MongoDB (local via Docker)
- **Containerization**: Docker Compose

## Prerequisites

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0
- **Docker**: For running MongoDB

## Getting Started

### 1. Install Dependencies

```bash
# Install pnpm if you haven't already
npm install -g pnpm

# Install all dependencies
pnpm install
```

### 2. Set Up Environment Variables

```bash
# Copy environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env

# Edit the .env files with your configuration
```

### 3. Start MongoDB

```bash
# Start MongoDB using Docker Compose
pnpm docker:up

# View logs
pnpm docker:logs

# Stop MongoDB
pnpm docker:down
```

MongoDB will be available at:
- **MongoDB**: `mongodb://localhost:27017`
- **Mongo Express** (Web UI): `http://localhost:8081` (admin/admin123)

### 4. Start Development Servers

```bash
# Start all services (API + Web)
pnpm dev

# Or start individually:
cd apps/api && pnpm dev    # API on http://localhost:3000
cd apps/web && pnpm dev    # Web on http://localhost:5173
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **API**: http://localhost:3000/api
- **Swagger Docs**: http://localhost:3000/api/docs
- **Mongo Express**: http://localhost:8081

## Development Workflow

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @rootshare/api build
pnpm --filter @rootshare/web build
```

### Testing

```bash
# Run all tests
pnpm test

# Run API unit tests
cd apps/api && pnpm test

# Run API tests with coverage
cd apps/api && pnpm test:cov

# Run E2E tests
cd apps/web && pnpm test:e2e
```

### Linting and Formatting

```bash
# Lint all packages
pnpm lint

# Format code
pnpm format
```

## Project Features (Course Requirements)

### ✅ Authentication
- [x] User registration and login (email/password)
- [ ] OAuth integration (Google/Facebook) - TODO
- [x] JWT with refresh token implementation
- [ ] Remember user session
- [ ] Logout functionality

### ✅ User Profile
- [ ] Display user details with profile image
- [ ] Show user's posts
- [ ] Edit profile (image, username)

### 📝 Content Sharing
- [ ] Upload posts (text + images)
- [ ] View all posts
- [ ] Edit own posts (text and images)
- [ ] Delete own posts
- [ ] Filter posts by user
- [ ] Infinite scroll with pagination
- [ ] AI integration for plant information (Gemini/ChatGPT)

### 💬 Comments
- [ ] Comment on posts
- [ ] View comments in separate screen
- [ ] Display comment count on main feed

### ❤️ Likes
- [ ] Like/unlike posts
- [ ] Display like status
- [ ] Efficient DB implementation

### 📚 Technical Requirements
- [x] Swagger API documentation
- [x] Unit tests for API (Jest)
- [x] TypeScript everywhere
- [x] Image storage on server (not DB)
- [x] Local MongoDB (not Atlas)
- [x] Git workflow with pull requests
- [ ] Docker deployment (if taught in course)

## API Documentation

Once the API is running, visit http://localhost:3000/api/docs for interactive Swagger documentation.

### Main Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/users/:id` - Get user profile
- `GET /api/plants` - Get user's plants
- `POST /api/plants` - Create new plant
- `GET /api/posts` - Get feed
- `POST /api/posts` - Create new post
- `POST /api/comments` - Add comment
- `POST /api/likes/:postId` - Toggle like

## Database Schema

### User
```typescript
{
  email: string (unique)
  username: string (unique)
  password: string (hashed)
  profileImageUrl?: string
  role: 'user' | 'admin'
  createdAt: Date
  updatedAt: Date
}
```

### Plant
```typescript
{
  userId: ObjectId
  name: string
  species: string
  status: 'active' | 'dead' | 'gifted'
  imageUrl: string
  createdAt: Date
  updatedAt: Date
}
```

### Post
```typescript
{
  userId: ObjectId
  plantId?: ObjectId  // Optional
  type: 'update' | 'swap' | 'giveaway'
  content: string
  images: string[]
  likesCount: number
  commentsCount: number
  createdAt: Date
  updatedAt: Date
}
```

## PDCA Workflow

This project follows the Plan-Do-Check-Act workflow as described in [docs/updated_instructions.md](docs/updated_instructions.md).

### Git Workflow
1. Create feature branch
2. Work in small batches (2-4 steps)
3. Commit after human verification
4. Complete tests
5. Publish branch after approval
6. Create PR for review

## Task Division (Nitzan & Nir)

### Nitzan (Inventory - Backend + Frontend)
- Backend: Auth, DB setup, Plant CRUD
- Frontend: Project setup, Inventory page, Add plant page, Plant details page

### Nir (Social - Backend + Frontend)
- Backend: Posts CRUD, Post-Plant linking
- Frontend: Feed page, Create post form, Post filters

## Scripts

```bash
pnpm dev          # Start all services in development
pnpm build        # Build all packages
pnpm test         # Run all tests
pnpm lint         # Lint all packages
pnpm format       # Format code with Prettier
pnpm clean        # Clean all build outputs
pnpm docker:up    # Start Docker services
pnpm docker:down  # Stop Docker services
pnpm docker:logs  # View Docker logs
```

## Contributing

1. Create a feature branch from `master`
2. Make your changes following the coding guidelines
3. Write/update tests
4. Ensure all tests pass
5. Create a pull request
6. Wait for review and approval

## License

ISC

## Authors

- Nitzan Avargil
- Nir Shitrit

---

For detailed implementation guidelines, see [docs/updated_instructions.md](docs/updated_instructions.md)

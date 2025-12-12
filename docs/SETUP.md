# RootShare - Quick Setup Guide

This guide will help you get the RootShare project up and running quickly.

## Prerequisites Checklist

- [ ] Node.js >= 18.0.0 installed
- [ ] pnpm >= 8.0.0 installed
- [ ] Docker Desktop installed and running
- [ ] Git installed

## Step-by-Step Setup

### 1. Install pnpm (if not already installed)

```bash
# Windows
npm install -g pnpm

# Verify installation
pnpm --version
```

### 2. Clone and Install

```bash
# Navigate to project directory
cd d:\Workspace\RootShare

# Install all dependencies
pnpm install
```

This will install dependencies for:
- Root workspace
- API (NestJS backend)
- Web (React frontend)
- Shared types package

### 3. Set Up Environment Files

```bash
# Copy root environment file
copy .env.example .env

# Copy API environment file
copy apps\api\.env.example apps\api\.env
```

Edit `apps\api\.env` if needed. The default values should work for local development.

### 4. Start MongoDB with Docker

```bash
# Start MongoDB container
pnpm docker:up

# Verify MongoDB is running
pnpm docker:logs
```

You should see:
- MongoDB running on `localhost:27017`
- Mongo Express UI on `http://localhost:8081` (login: admin/admin123)

### 5. Build Shared Types

```bash
# Build the shared types package
cd packages\shared-types
pnpm build
cd ..\..
```

### 6. Start Development Servers

```bash
# Option 1: Start everything from root
pnpm dev

# Option 2: Start in separate terminals
# Terminal 1 - API
cd apps\api
pnpm dev

# Terminal 2 - Frontend
cd apps\web
pnpm dev
```

### 7. Verify Everything is Running

Open your browser and check:

- [ ] Frontend: http://localhost:5173
- [ ] API: http://localhost:3000/api
- [ ] Swagger Docs: http://localhost:3000/api/docs
- [ ] MongoDB Express: http://localhost:8081

## Troubleshooting

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
docker ps

# If not running, start it
pnpm docker:up

# View MongoDB logs
pnpm docker:logs
```

### Port Already in Use

If you get "port already in use" errors:

**API (port 3000):**
```bash
# Windows - Find and kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Frontend (port 5173):**
```bash
# Windows - Find and kill process
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Shared Types Not Found

```bash
# Rebuild shared types
cd packages\shared-types
pnpm build

# Restart API and Web servers
```

### Docker Issues

```bash
# Stop all containers
pnpm docker:down

# Remove volumes and start fresh
docker-compose down -v
pnpm docker:up
```

### pnpm Install Fails

```bash
# Clear pnpm cache
pnpm store prune

# Delete node_modules and reinstall
rm -rf node_modules
rm -rf apps\*/node_modules
rm -rf packages\*/node_modules
pnpm install
```

## Next Steps

### For Nitzan (Inventory Features)

1. Implement Plants CRUD in `apps/api/src/modules/plants/`
2. Create Inventory UI in `apps/web/src/pages/InventoryPage.tsx`
3. Build PlantCard component
4. Implement Add Plant form
5. Create Plant Details page

### For Nir (Social Features)

1. Implement Posts CRUD in `apps/api/src/modules/posts/`
2. Create Feed UI in `apps/web/src/pages/FeedPage.tsx`
3. Build PostCard component
4. Implement Create Post form
5. Add post type filters

### Both

1. Implement Auth forms (Login/Register)
2. Add image upload functionality
3. Write unit tests for API endpoints
4. Add E2E tests for critical flows

## Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Make changes and test
pnpm dev
pnpm test

# 3. Commit changes (small commits)
git add .
git commit -m "feat: add your feature"

# 4. Push and create PR
git push -u origin feature/your-feature-name

# 5. Create Pull Request on GitHub
```

## Useful Commands

```bash
# Development
pnpm dev                    # Start all in dev mode
pnpm build                  # Build all packages
pnpm test                   # Run all tests
pnpm lint                   # Lint all packages
pnpm format                 # Format code

# Docker
pnpm docker:up              # Start MongoDB
pnpm docker:down            # Stop MongoDB
pnpm docker:logs            # View MongoDB logs

# Clean
pnpm clean                  # Clean all build outputs
```

## Additional Resources

- [Turborepo Docs](https://turbo.build)
- [NestJS Docs](https://docs.nestjs.com)
- [React Docs](https://react.dev)
- [TailwindCSS Docs](https://tailwindcss.com)
- [MongoDB Docs](https://www.mongodb.com/docs)

## Need Help?

1. Check the main [README.md](README.md)
2. Review [docs/updated_instructions.md](docs/updated_instructions.md)
3. Check API documentation at http://localhost:3000/api/docs
4. Review the project requirements in `docs/` folder

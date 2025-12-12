# RootShare 🌱

A social platform for urban gardeners and plant enthusiasts to document plant growth, share collections, and trade cuttings with the community.

**Final Project - Web Development Course - Colman College**

**Developers**: Nitzan Avargil & Nir Shitrit

---

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Start MongoDB
pnpm docker:up

# 3. Build shared types
cd packages/shared-types && pnpm build && cd ../..

# 4. Start development
pnpm dev
```

**Access Points:**
- Frontend: http://localhost:5173
- API: http://localhost:3000/api
- Swagger Docs: http://localhost:3000/api/docs
- MongoDB UI: http://localhost:8081 (admin/admin123)

---

## Tech Stack

- **Backend**: NestJS + TypeScript + MongoDB + JWT + Swagger
- **Frontend**: React + Vite + TypeScript + TailwindCSS + shadcn/ui
- **Monorepo**: Turborepo with pnpm workspaces
- **Database**: MongoDB (Docker)
- **Testing**: Jest (API) + Playwright (E2E)

---

## Project Structure

```
rootshare/
├── apps/
│   ├── api/          # NestJS backend API
│   └── web/          # React frontend
├── packages/
│   └── shared-types/ # Shared TypeScript types
├── docs/             # Documentation
└── scripts/          # Utility scripts
```

---

## Documentation

📚 **Complete documentation available in [docs/](docs/)**

- **[Setup Guide](docs/SETUP.md)** - Step-by-step installation and setup
- **[Project Summary](docs/PROJECT_SUMMARY.md)** - Complete project status and roadmap
- **[Quick Reference](docs/QUICK_REFERENCE.md)** - Developer cheatsheet
- **[Full Documentation](docs/README.md)** - Complete project documentation
- **[API Documentation](docs/API-README.md)** - Backend API guide
- **[Frontend Documentation](docs/WEB-README.md)** - React frontend guide

---

## Development

```bash
# Start all services
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Lint code
pnpm lint

# Format code
pnpm format
```

---

## Project Status

**Overall Completion: ~40%**

✅ **Complete:**
- Monorepo infrastructure
- Authentication system (JWT + refresh tokens)
- Database setup (MongoDB + schemas)
- Shared TypeScript types
- Development environment

🚧 **In Progress:**
- Backend CRUD modules (Plants, Posts, Comments, Likes)
- Frontend pages and components
- Image upload functionality
- Unit and E2E tests

---

## Contributing

This is a final project for academic purposes. For development workflow and contribution guidelines, see [docs/README.md](docs/README.md).

---

## License

ISC

---

**For detailed documentation, troubleshooting, and development guides, visit [docs/](docs/)**

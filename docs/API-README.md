# RootShare API

NestJS backend API for the RootShare platform.

## Features

- JWT authentication with refresh tokens
- MongoDB integration with Mongoose
- Swagger/OpenAPI documentation
- Input validation with class-validator
- Unit testing with Jest
- TypeScript strict mode

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://rootshare:rootshare123@localhost:27017/rootshare?authSource=admin
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

### Development

```bash
# Start in watch mode
pnpm dev

# Start normally
pnpm start

# Build
pnpm build

# Production mode
pnpm start:prod
```

### Testing

```bash
# Unit tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:cov

# E2E tests
pnpm test:e2e
```

## Project Structure

```
src/
├── modules/
│   ├── auth/           # Authentication (JWT, strategies, guards)
│   ├── users/          # User management
│   ├── plants/         # Plant inventory
│   ├── posts/          # Social posts
│   ├── comments/       # Post comments
│   └── likes/          # Post likes
├── app.module.ts       # Root module
└── main.ts             # Application entry point
```

## API Endpoints

See Swagger documentation at http://localhost:3000/api/docs

## Module Implementation Status

- ✅ Auth Module (Complete)
- ✅ Users Module (Complete)
- 🚧 Plants Module (Stub - TODO)
- 🚧 Posts Module (Stub - TODO)
- 🚧 Comments Module (Stub - TODO)
- 🚧 Likes Module (Stub - TODO)

## TODO

### Plants Module
- [ ] Create plant endpoint
- [ ] Get all plants with filters (status)
- [ ] Get single plant
- [ ] Update plant
- [ ] Delete plant
- [ ] Unit tests

### Posts Module
- [ ] Create post endpoint
- [ ] Get feed with pagination
- [ ] Get posts by user
- [ ] Get single post
- [ ] Update post
- [ ] Delete post
- [ ] Filter by type (swap/giveaway/update)
- [ ] Unit tests

### Comments Module
- [ ] Add comment to post
- [ ] Get comments for post
- [ ] Update comment
- [ ] Delete comment
- [ ] Increment comment count on post
- [ ] Unit tests

### Likes Module
- [ ] Toggle like on post
- [ ] Check if user liked post
- [ ] Get like count for post
- [ ] Update like count on post
- [ ] Unit tests

### File Upload
- [ ] Implement multer configuration
- [ ] Image upload endpoint
- [ ] Image storage service
- [ ] Validation (file type, size)
- [ ] Cleanup on deletion

### AI Integration
- [ ] Integrate Gemini/ChatGPT API
- [ ] Plant information enrichment
- [ ] Rate limiting for AI calls
- [ ] Error handling

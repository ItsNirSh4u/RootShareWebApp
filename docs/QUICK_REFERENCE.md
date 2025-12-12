# RootShare - Quick Reference Guide

## Common Commands

### Development
```bash
# Start everything
pnpm dev

# Start API only
cd apps/api && pnpm dev

# Start Web only
cd apps/web && pnpm dev

# Build everything
pnpm build

# Run tests
pnpm test
```

### Docker
```bash
# Start MongoDB
pnpm docker:up

# Stop MongoDB
pnpm docker:down

# View logs
pnpm docker:logs
```

### URLs
- Frontend: http://localhost:5173
- API: http://localhost:3000/api
- Swagger: http://localhost:3000/api/docs
- MongoDB UI: http://localhost:8081 (admin/admin123)

## Project Structure Cheatsheet

```
rootshare/
├── apps/
│   ├── api/              # NestJS Backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/     ✅ DONE
│   │   │   │   ├── users/    ✅ DONE
│   │   │   │   ├── plants/   🚧 TODO
│   │   │   │   ├── posts/    🚧 TODO
│   │   │   │   ├── comments/ 🚧 TODO
│   │   │   │   └── likes/    🚧 TODO
│   │   │   ├── main.ts
│   │   │   └── app.module.ts
│   │   └── test/
│   └── web/              # React Frontend
│       ├── src/
│       │   ├── components/   ⏳ TODO
│       │   ├── pages/        🚧 Stubs
│       │   ├── stores/       ✅ DONE
│       │   ├── lib/          ✅ DONE
│       │   └── App.tsx
│       └── e2e/
└── packages/
    └── shared-types/     ✅ DONE
```

## Import Shared Types

### In Backend (API)
```typescript
import { IUser, IPlant, IPost, PlantStatus, PostType } from '@rootshare/shared-types';
```

### In Frontend (Web)
```typescript
import { IUser, IPlant, IPost, PlantStatus, PostType } from '@rootshare/shared-types';
```

## Creating a New API Endpoint

### 1. Create DTO
```typescript
// apps/api/src/modules/plants/dto/create-plant.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePlantDto {
  @ApiProperty({ example: 'My Monstera' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Monstera Deliciosa' })
  @IsString()
  @IsNotEmpty()
  species: string;
}
```

### 2. Implement Service Method
```typescript
// apps/api/src/modules/plants/plants.service.ts
async create(userId: string, createPlantDto: CreatePlantDto): Promise<IPlant> {
  const plant = new this.plantModel({
    ...createPlantDto,
    userId,
    status: PlantStatus.ACTIVE,
  });
  const savedPlant = await plant.save();
  return this.sanitizePlant(savedPlant);
}
```

### 3. Add Controller Endpoint
```typescript
// apps/api/src/modules/plants/plants.controller.ts
@Post()
@ApiOperation({ summary: 'Create new plant' })
@ApiResponse({ status: 201, description: 'Plant created successfully' })
async create(@Request() req: any, @Body() createPlantDto: CreatePlantDto) {
  return this.plantsService.create(req.user.id, createPlantDto);
}
```

### 4. Write Unit Test
```typescript
// apps/api/src/modules/plants/plants.service.spec.ts
describe('PlantsService', () => {
  it('should create a plant', async () => {
    const createDto = { name: 'Test', species: 'Test Species' };
    const result = await service.create('userId', createDto);
    expect(result).toBeDefined();
    expect(result.name).toBe('Test');
  });
});
```

## Creating a React Component

### 1. Create Component File
```typescript
// apps/web/src/components/PlantCard.tsx
interface PlantCardProps {
  plant: IPlant;
  onEdit?: (plant: IPlant) => void;
  onDelete?: (id: string) => void;
}

export function PlantCard({ plant, onEdit, onDelete }: PlantCardProps): JSX.Element {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <img src={plant.imageUrl} alt={plant.name} className="w-full h-48 object-cover rounded" />
      <h3 className="mt-2 font-semibold">{plant.name}</h3>
      <p className="text-sm text-gray-600">{plant.species}</p>
      {/* Add edit/delete buttons */}
    </div>
  );
}
```

### 2. Use TanStack Query for Data Fetching
```typescript
// apps/web/src/pages/InventoryPage.tsx
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export function InventoryPage(): JSX.Element {
  const { data: plants, isLoading } = useQuery({
    queryKey: ['plants'],
    queryFn: async () => {
      const response = await api.get('/plants');
      return response.data;
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {plants?.map((plant) => (
        <PlantCard key={plant.id} plant={plant} />
      ))}
    </div>
  );
}
```

## Common Patterns

### Protected API Route (Backend)
```typescript
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Get()
async findAll(@Request() req: any) {
  return this.service.findAll(req.user.id);
}
```

### API Call with Auth (Frontend)
```typescript
// The axios interceptor automatically adds the token
const response = await api.get('/plants');
// No need to manually add Authorization header
```

### Form Validation (Frontend)
```typescript
import { useForm } from 'react-hook-form';

const { register, handleSubmit, formState: { errors } } = useForm();

const onSubmit = async (data) => {
  await api.post('/plants', data);
};
```

### Mobile-First Styling (Frontend)
```tsx
// Mobile: 2 columns, Tablet: 3 columns, Desktop: 4 columns
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
```

## Troubleshooting

### MongoDB Connection Failed
```bash
# Check if Docker is running
docker ps

# Restart MongoDB
pnpm docker:down
pnpm docker:up
```

### Shared Types Not Found
```bash
# Rebuild shared types
cd packages/shared-types
pnpm build
cd ../..

# Restart dev servers
```

### Port Already in Use
```bash
# Windows - Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Windows - Kill process on port 5173
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### TypeScript Errors in IDE
```bash
# Restart TypeScript server in VSCode
Ctrl+Shift+P > "TypeScript: Restart TS Server"

# Or rebuild
pnpm build
```

## Testing

### Run API Unit Tests
```bash
cd apps/api
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:cov
```

### Run E2E Tests
```bash
cd apps/web
pnpm test:e2e
```

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/plant-crud

# Make changes and commit
git add .
git commit -m "feat: implement plant CRUD endpoints"

# Push and create PR
git push -u origin feature/plant-crud

# After review, merge and delete branch
git checkout master
git pull
git branch -d feature/plant-crud
```

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://rootshare:rootshare123@localhost:27017/rootshare?authSource=admin
JWT_ACCESS_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:3000/api
```

## MongoDB Access

### Via Mongo Express
- URL: http://localhost:8081
- Username: admin
- Password: admin123

### Via MongoDB Compass
- Connection String: `mongodb://rootshare:rootshare123@localhost:27017/rootshare?authSource=admin`

### Via CLI
```bash
docker exec -it rootshare-mongodb mongosh -u rootshare -p rootshare123 --authenticationDatabase admin
```

## Helpful Resources

- **NestJS Docs**: https://docs.nestjs.com
- **React Docs**: https://react.dev
- **TailwindCSS Docs**: https://tailwindcss.com
- **shadcn/ui**: https://ui.shadcn.com
- **TanStack Query**: https://tanstack.com/query
- **MongoDB Docs**: https://www.mongodb.com/docs

## Next Steps

1. Pick a module to implement (Plants or Posts)
2. Implement backend service methods
3. Add controller endpoints
4. Write unit tests
5. Test with Swagger
6. Implement frontend page
7. Connect frontend to API
8. Test E2E flow
9. Commit and create PR

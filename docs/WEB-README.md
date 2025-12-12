# RootShare Web

React frontend for the RootShare platform.

## Features

- React 18 with TypeScript
- Vite for fast development and builds
- TailwindCSS with mobile-first approach
- shadcn/ui component library
- React Router for navigation
- TanStack Query for data fetching
- Zustand for state management
- Playwright for E2E testing

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Development

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Testing

```bash
# Run unit tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run E2E tests
pnpm test:e2e
```

## Project Structure

```
src/
├── components/         # Reusable UI components
├── pages/             # Page components
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── FeedPage.tsx
│   ├── InventoryPage.tsx
│   └── ProfilePage.tsx
├── stores/            # Zustand stores
│   └── auth.store.ts
├── lib/               # Utilities
│   ├── api.ts         # Axios instance with interceptors
│   └── utils.ts       # Helper functions
├── App.tsx            # Root component with routing
└── main.tsx           # Application entry point
```

## Page Implementation Status

- ✅ HomePage (Landing page)
- 🚧 LoginPage (Stub - TODO)
- 🚧 RegisterPage (Stub - TODO)
- 🚧 FeedPage (Stub - TODO)
- 🚧 InventoryPage (Stub - TODO)
- 🚧 ProfilePage (Stub - TODO)

## TODO

### Authentication Pages
- [ ] Login form with validation
- [ ] Registration form with validation
- [ ] OAuth buttons (Google/Facebook)
- [ ] Error handling and display
- [ ] Loading states
- [ ] Redirect after login

### Feed Page
- [ ] Post list component
- [ ] Post card component
- [ ] Infinite scroll implementation
- [ ] Filter by post type
- [ ] Like button functionality
- [ ] Comment count display
- [ ] Create post button/modal

### Inventory Page
- [ ] Plant grid layout (mobile: 2 cols, desktop: 4 cols)
- [ ] Plant card component
- [ ] Filter by status (active/dead/gifted)
- [ ] Add plant button/modal
- [ ] Empty state

### Plant Details Page
- [ ] Plant information display
- [ ] Timeline of posts related to plant
- [ ] Edit plant modal
- [ ] Delete plant confirmation
- [ ] Status update

### Profile Page
- [ ] User information display
- [ ] Profile image upload
- [ ] Edit profile modal
- [ ] User's posts grid
- [ ] Logout button

### Components Needed
- [ ] PlantCard component
- [ ] PostCard (FeedPost) component
- [ ] Layout with navigation
- [ ] BottomNavigation (mobile)
- [ ] SideBar (desktop)
- [ ] ActionFab (floating + button)
- [ ] Modal/Dialog components
- [ ] Form components (Input, Button, etc.)
- [ ] Image upload component
- [ ] Loading spinner
- [ ] Error boundary

### API Integration
- [ ] Auth API calls (login, register, refresh)
- [ ] Plants API calls (CRUD)
- [ ] Posts API calls (CRUD, feed)
- [ ] Comments API calls
- [ ] Likes API calls
- [ ] Image upload API call
- [ ] Error handling
- [ ] Loading states
- [ ] Optimistic updates

## Styling Guidelines

### Mobile First Approach

Always write mobile styles first, then add responsive breakpoints:

```tsx
// Mobile: 2 columns, Desktop: 4 columns
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {/* content */}
</div>
```

### Post Type Colors

Use color coding for different post types:

```tsx
// Update: Green
<Badge className="bg-green-100 text-green-800">Update</Badge>

// Swap: Blue
<Badge className="bg-blue-100 text-blue-800">Swap</Badge>

// Giveaway: Purple
<Badge className="bg-purple-100 text-purple-800">Giveaway</Badge>
```

## Environment Variables

Create `.env.local`:

```env
VITE_API_URL=http://localhost:3000/api
```

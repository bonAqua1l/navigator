# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Navigator is a real estate CRM system built with React, TypeScript, and Supabase. It provides property management, viewing scheduling, user roles management, and admin functionality for a real estate business. The application supports multiple user roles (super_admin, manager, intern, blocked) with different permissions.

## Tech Stack

- **Frontend**: React 18.3, TypeScript 5.8, Vite 5.4
- **Routing**: React Router DOM 6.30
- **UI Components**: shadcn-ui (Radix UI primitives) + Tailwind CSS 3.4
- **State Management**: TanStack React Query (v5)
- **Backend**: Supabase (PostgreSQL database, authentication, edge functions)
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS with custom theme configuration

## Common Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:8080)
npm run dev

# Build for production
npm run build

# Build for development mode
npm run build:dev

# Lint the codebase
npm run lint

# Preview production build
npm preview
```

## Project Architecture

### Directory Structure

- `src/components/` - Reusable React components
  - `src/components/ui/` - shadcn-ui components (Button, Card, Dialog, etc.)
  - `src/components/layout/` - Layout components (DashboardLayout, Sidebar)
- `src/pages/` - Page-level components mapped to routes
- `src/contexts/` - React contexts (AuthContext for authentication)
- `src/hooks/` - Custom React hooks
- `src/integrations/supabase/` - Supabase client configuration and types
- `src/types/` - TypeScript type definitions
  - `database.ts` - Core database types (Profile, Property, Viewing, etc.)
  - `property.ts` - Property reference data types (categories, areas, conditions)
- `src/lib/` - Utility functions
- `supabase/migrations/` - Database migration files
- `supabase/functions/` - Supabase Edge Functions

### Authentication & Authorization

The app uses Supabase Auth with a role-based access control system:
- `AuthContext` (`src/contexts/AuthContext.tsx`) manages user state and roles
- User roles are stored in the `user_roles` table with types: `super_admin`, `manager`, `intern`, `blocked`
- `DashboardLayout` protects authenticated routes - redirects to `/login` if not authenticated
- Use `useAuth()` hook to access user, profile, and role information (`isAdmin`, `isManager`, `isIntern`)

### Routing Structure

All routes are defined in `src/App.tsx`:
- Public routes: `/`, `/login`, `/properties`, `/properties/:id/public`
- Protected routes (require authentication): All routes under `DashboardLayout`
  - `/dashboard` - Main dashboard with property listings
  - `/my-properties` - User's own properties
  - `/properties/new` - Create new property
  - `/properties/:id/edit` - Edit property
  - `/properties/:id` - Property details
  - `/favorites` - Favorite properties
  - `/viewings` - Scheduled viewings
  - `/new-buildings` - New building listings
  - `/admin` - Admin panel (role-restricted)
  - `/audit` - Audit logs
  - `/reference-data` - Manage reference data
  - `/trash` - Deleted properties
  - `/profile` - User profile

### Data Model

Key entities in the database:
- **Properties**: Main entity with foreign keys to reference tables
  - Uses reference data (categories, subcategories, areas, proposals, conditions, statuses)
  - Has old fields (`deal_type`, `category`, `rooms_count`) for backward compatibility
  - New fields use IDs referencing lookup tables
- **Property Photos**: Multiple photos per property with display order
- **Profiles**: User profile information linked to Supabase auth
- **User Roles**: Role assignments stored separately for security
- **Viewings**: Scheduled property viewings with status tracking
- **Favorites**: User-favorited properties with priority
- **Deals**: Transaction records with commission tracking
- **Audit Logs**: Track all database changes

### Reference Data System

The application uses a comprehensive reference data system for properties:
- Property Action Categories (sale, rent, exchange)
- Property Categories (apartment, house, commercial, land, garage)
- Property Subcategories (linked to categories)
- Property Areas (hierarchical: regions > cities > districts)
- Property Proposals (offers/listings types)
- Property Conditions (new, renovation, etc.)
- Property Statuses (published, no_ads, deleted, sold)
- Payment Types, Document Types, Communication Types, Furniture Types

All reference tables can be managed through the `/reference-data` page.

### State Management Pattern

- Use TanStack Query for server state (fetching, caching, mutations)
- Local component state with `useState` for UI state
- Global auth state managed by `AuthContext`
- Toast notifications via `useToast()` hook from shadcn-ui

### Styling Conventions

- Tailwind CSS with custom HSL color variables defined in `src/index.css`
- Custom theme extensions in `tailwind.config.ts`:
  - Primary, secondary, success, warning, info, destructive colors
  - Sidebar-specific colors
  - Custom gradients and transitions
- Use `@/` alias for absolute imports (configured in `tsconfig.json` and `vite.config.ts`)

### Supabase Integration

- Client initialized in `src/integrations/supabase/client.ts`
- Auto-generated types in `src/integrations/supabase/types.ts`
- Edge functions: `create-user`, `delete-user`
- Row Level Security (RLS) enabled on tables
- Real-time subscriptions available via Supabase client

## Important Notes

- **Lovable Integration**: This project is managed through Lovable platform - changes can be made via Lovable or locally
- **TypeScript Configuration**: Strict null checks disabled, implicit any allowed - be cautious with type safety
- **Development Server**: Runs on port 8080 with IPv6 support (`::`), not default 5173
- **Image Assets**: Logo and assets in `src/assets/` and `public/` directories
- **Lazy Loading**: Properties dashboard implements pagination and intersection observer for performance
- **Russian Language**: UI text is in Russian (e.g., "Успешный вход", "Добро пожаловать")

## Database Migrations

Supabase migrations in `supabase/migrations/` directory should be applied in chronological order. When adding new migrations:
1. Create migration file with timestamp prefix
2. Test locally if possible
3. Apply to production via Supabase CLI or dashboard

## Common Patterns

**Fetching data with error handling:**
```typescript
const { data, error } = await supabase
  .from('properties')
  .select('*, property_photos(*)')
  .eq('status', 'published');

if (error) {
  console.error('Error:', error);
  toast({ variant: "destructive", title: "Ошибка", description: error.message });
}
```

**Using reference data in forms:**
Use the reference data types from `src/types/property.ts` and fetch from respective tables (`property_categories`, `property_action_categories`, etc.)

**Protected routes:**
Pages under `DashboardLayout` automatically redirect unauthenticated users to `/login`

**Role-based UI:**
```typescript
const { isAdmin, isManager } = useAuth();
if (isAdmin) {
  // Show admin-only features
}
```

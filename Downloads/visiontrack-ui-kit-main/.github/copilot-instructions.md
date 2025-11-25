# VisionTrack UI Kit - AI Coding Agent Instructions

## Project Overview

VisionTrack is a **Django-integrated React admin dashboard** for employee attendance tracking with facial recognition. This is a **frontend-only repository** (built with Vite + React + TypeScript) that connects to a separate Django backend API.

**Key Points:**
- Frontend handles UI/UX, authentication, data visualization, and face capture workflows
- Backend (separate Django project) handles API logic, face recognition, and database
- Lovable.dev integration for automated deployments
- shadcn/ui component library with Tailwind CSS

---

## Architecture & Data Flow

### Core Stack
- **Build:** Vite (dev: `::`/8080, not localhost)
- **Framework:** React 18.3 + React Router 6.30
- **Type:** TypeScript 5.8
- **UI Library:** shadcn/ui (Radix UI primitives)
- **Styling:** Tailwind CSS 3.4 with custom animations
- **State:** React Query 5.83 (query client for API calls), local React state
- **Forms:** React Hook Form 7.61 + Zod 3.25 validation
- **Charting:** Recharts 2.15

### Directory Structure
```
src/
  ├── components/
  │   ├── AdminLayout.tsx        # Sidebar + header layout wrapper
  │   ├── ui/                    # shadcn/ui components (40+ primitives)
  │   └── Navbar.tsx
  ├── pages/                     # Route pages (Login, Dashboard, etc.)
  ├── services/                  # API call layer (employeeService, etc.)
  ├── types/models.ts            # All TypeScript interfaces
  ├── config/api.ts              # API endpoint definitions & apiRequest helper
  ├── hooks/use-toast.ts         # Sonner toast notifications
  └── lib/utils.ts               # Tailwind cn() utility
```

### API Communication Pattern
1. **Service Layer** (`/src/services/*.ts`) - Functions call `apiRequest()` helper
2. **apiRequest()** (`/src/config/api.ts`) - Centralized fetch wrapper with:
   - Auto-attach `Authorization: Bearer {token}` header
   - Token stored in localStorage as `auth_token`
   - JSON error parsing with custom `ApiError` class
3. **API Endpoints** (`/src/config/api.ts`) - Centralized URL definitions using `VITE_DJANGO_API_URL`
4. **Response Format** - All responses must follow:
   ```typescript
   { success: boolean; data: T; message?: string }
   ```

**Example Flow:**
```typescript
// In component
const employees = await employeeService.getAll();

// In employeeService.getAll()
const response = await apiRequest<PaginatedResponse<Employee>>(
  API_ENDPOINTS.employees.list
);
return response.results;

// apiRequest() automatically:
// - Adds auth token
// - Throws ApiError on non-200
// - Parses JSON response
```

---

## Critical Developer Workflows

### Local Development
```bash
npm install                 # Install dependencies (uses bun.lockb)
npm run dev                 # Start Vite dev server (http://localhost:8080)
npm run build              # Production build
npm run lint               # Run ESLint
npm run preview            # Preview production build
```

**Note:** Dev server runs on `::` (all IPv4/IPv6) on port 8080, not `localhost:3000`.

### Environment Setup
Create `.env.local` (Vite will auto-load):
```env
VITE_DJANGO_API_URL=http://localhost:8000/api
```
Variables must be prefixed `VITE_` to be accessible in browser via `import.meta.env`.

### Build & Deployment
- Production builds via Lovable.dev (see README.md for link)
- `npm run build:dev` for development-mode builds
- Vite output to `/dist` folder

---

## Project-Specific Patterns

### 1. **Page Routing & Layout**
- **Routes defined in** `App.tsx` with React Router 6 (BrowserRouter)
- **Admin pages wrapped with** `AdminLayout` component (provides sidebar + header)
- **Special routes:**
  - `/activate/:uid/:token` → Email account activation flow
  - `/password/reset/confirm/:uid/:token` → Password reset confirmation
- Pages use **named imports** from shadcn/ui (e.g., `import { Button } from "@/components/ui/button"`)

### 2. **Authentication & State**
- **Login:** Stores JWT token in localStorage as `auth_token`
- **User role:** Stored as `user_role` in localStorage
- **Services check token:** Each `apiRequest()` automatically includes token header
- **Logout:** Clears both localStorage keys in `authService.logout()`
- **No global auth context** - just localStorage checks in services

### 3. **Form Handling Pattern**
- Use **React Hook Form** + **Zod** (not raw controlled components)
- Forms are **not extensively used yet** - mostly simple controlled inputs
- Example Login form in `login.tsx` uses controlled state (`formData`, `handleChange`)

### 4. **UI Components & Styling**
- **All UI from shadcn/ui** (`/src/components/ui/`) - don't create custom inputs
- **Animations** defined in `tailwind.config.ts` (fade-in, fade-up, scan, etc.)
- **Toasts:** Use `useToast()` hook for notifications (both Sonner + Radix)
- **Icons:** Lucide React (20+ icons used: Users, Clock, FileText, Scan, etc.)
- **Color system:** CSS variables (--primary, --secondary, --destructive, etc.)

### 5. **Service Layer Conventions**
Each service file exports a service object with async methods:
```typescript
export const employeeService = {
  async getAll(): Promise<Employee[]> { ... },
  async getById(id: string): Promise<Employee> { ... },
  async create(data: CreateEmployeeDto): Promise<Employee> { ... },
  async update(id: string, data: UpdateEmployeeDto): Promise<Employee> { ... },
  async delete(id: string): Promise<void> { ... },
};
```
- **All methods catch & log errors**, then throw for component handling
- **File upload:** Convert to FormData before passing to `apiRequest()` with empty headers object `headers: {}`
- **Query strings:** Build manually with `URLSearchParams` (no URL builder library)

### 6. **Error Handling**
- **Services throw** `ApiError` with status code for components to catch
- **Components use toasts** for user-facing errors: `toast({ title: "Error", description: error.message })`
- **No error boundary yet** - handle in components

### 7. **Data Types**
- **All types in** `/src/types/models.ts`
- **Naming:** DTOs use `CreateEmployeeDto`, `UpdateEmployeeDto` (not suffixed with "Request")
- **API response wrapper:** `ApiResponse<T>`, Paginated: `PaginatedResponse<T>`
- **Status enums:** `'Present' | 'Late' | 'Absent'` (strings, not enums)

---

## Integration Points & External Dependencies

### Django Backend Integration
- **See README_DJANGO_INTEGRATION.md for full API spec**
- **Key endpoints:**
  - `/api/employees/` - CRUD + search
  - `/api/attendance/` - Mark + list with filters
  - `/api/faces/register/` - Face enrollment
  - `/api/reports/` - Generate + export
  - `/api/auth/` - Login/logout/verify
- **CORS required** on Django side for http://localhost:8080 and production domains

### Lovable Integration
- **componentTagger plugin** in Vite config (development mode only)
- **lovable-tagger** dependency for auto-tagging components
- Project linked to Lovable.dev for automated CI/CD

### Key Dependencies
- **@hookform/resolvers** - Form validation (not actively used yet)
- **@tanstack/react-query** - QueryClient initialized but minimal usage
- **recharts** - Charting library (used in AdminDashboard)
- **sonner** - Toast notifications (alternative to Radix toast)
- **react-router-dom** - Client-side routing with dynamic params

### shadcn/ui Components Available
40+ components in `/src/components/ui/`: button, card, input, select, dialog, drawer, tabs, table, calendar, chart, etc.

---

## When Creating New Features

### Adding a New Admin Page
1. Create `/src/pages/NewPage.tsx`
2. Import `AdminLayout` wrapper
3. Add route in `App.tsx`
4. Add menu item in `AdminLayout.tsx` → `menuItems` array

### Adding API Integration
1. Define types in `/src/types/models.ts`
2. Add endpoints to `/src/config/api.ts` → `API_ENDPOINTS`
3. Create `/src/services/newService.ts` following existing service patterns
4. Use in components: `const data = await newService.method()`

### Adding UI Component
1. Don't create custom - use shadcn/ui from `/src/components/ui/`
2. If needed, fork from shadcn registry

---

## Avoid Common Mistakes

- ❌ Don't import Button directly - use `import { Button } from "@/components/ui/button"`
- ❌ Don't create global Redux/Zustand state - use localStorage + services
- ❌ Don't hardcode API URLs - use `API_ENDPOINTS` from config
- ❌ Don't use localhost for dev server - it's configured as `::`
- ❌ Don't forget `headers: {}` when sending FormData (let browser set Content-Type)
- ❌ Don't create custom inputs - shadcn has Input, Select, Textarea, etc.
- ❌ Don't forget role-based access checks (logged in ≠ authorized for admin)

---

## Quick Reference

| What | Where |
|------|-------|
| API URLs | `src/config/api.ts` → `API_ENDPOINTS` |
| Types | `src/types/models.ts` |
| Services | `src/services/*.ts` |
| UI Components | `src/components/ui/*.tsx` |
| Routes | `src/App.tsx` |
| Layout | `src/components/AdminLayout.tsx` |
| Styling | `tailwind.config.ts` (Tailwind + custom animations) |
| Env Vars | `.env.local` (prefix with `VITE_`) |

---

## Additional Resources

- **README.md** - Lovable project info, deployment
- **README_DJANGO_INTEGRATION.md** - Full backend API contract
- **vite.config.ts** - Build config with aliases (`@` = `src/`)
- **ESLint rules** - React hooks required, custom components exports enforced

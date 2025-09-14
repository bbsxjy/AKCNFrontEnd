# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AKCNFrontEnd is the frontend application for the AK Cloud-Native Transformation Management System (AK云原生改造管理系统). This system manages and tracks the transformation of enterprise applications from traditional architecture to AK/cloud-native architecture.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Lint and fix code
npm run lint
npm run lint:fix

# Type checking
npm run type-check
```

## Architecture

### Technology Stack
- **Framework**: Vue 3 (Composition API)
- **UI Components**: Element Plus
- **State Management**: Pinia
- **Router**: Vue Router 4
- **HTTP Client**: Axios
- **Build Tool**: Vite
- **Language**: TypeScript
- **CSS**: SCSS/Sass

### Project Structure
```
src/
├── api/              # API service modules
├── assets/           # Static assets
├── components/       # Reusable components
│   ├── common/      # Generic UI components
│   └── business/    # Business-specific components
├── composables/     # Vue composition functions
├── layouts/         # Layout components
├── router/          # Route definitions
├── stores/          # Pinia state stores
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── views/           # Page components
```

### Core Features

1. **Application Management**
   - CRUD operations for applications
   - L2 ID unique identifier system
   - Supervision year tracking
   - Transformation target (AK/Cloud-Native)

2. **Sub-task Tracking**
   - Module-level task management
   - Progress percentage tracking
   - Date management (planned vs actual)
   - Blocking status with reasons

3. **Progress Monitoring**
   - Automatic status calculation
   - Real-time progress updates
   - Department-wise tracking
   - Delay detection and alerts

4. **Data Import/Export**
   - Excel file import/export
   - Batch operations
   - Data validation
   - Import history tracking

5. **Audit System**
   - Complete operation logging
   - Data rollback capability
   - User action tracking
   - Change history with old/new values

### API Integration

- **Base URL**: `https://ak-transform.company.com/api/v1`
- **Authentication**: SSO Token (Bearer Token)
- **Key Endpoints**:
  - `/sso/verify` - SSO authentication
  - `/applications` - Application management
  - `/subtasks` - Sub-task operations
  - `/audit/logs` - Audit trail
  - `/reports/export` - Excel export
  - `/batch/import` - Bulk import

### State Management (Pinia)

Key stores:
- `useAuthStore` - User authentication and SSO
- `useApplicationStore` - Application data and operations
- `useSubTaskStore` - Sub-task management
- `useAuditStore` - Audit log operations

### Component Guidelines

1. **Naming Convention**
   - PascalCase for component files
   - Prefix business components with domain name
   - Use `.vue` extension for all components

2. **Component Structure**
   ```vue
   <template>
     <!-- Template content -->
   </template>

   <script setup lang="ts">
   // Composition API with TypeScript
   </script>

   <style scoped lang="scss">
   // Scoped SCSS styles
   </style>
   ```

3. **Key Business Components**
   - `ApplicationList` - Display application grid
   - `SubTaskForm` - Edit sub-task details
   - `ImportDialog` - Excel import interface
   - `ProgressChart` - Visual progress display
   - `AuditLogTable` - Audit trail viewer

### Security Considerations

- SSO token stored in localStorage/sessionStorage
- Token refresh mechanism
- RBAC permissions (Admin, Manager, Editor, Viewer)
- API request interceptors for auth headers
- Automatic logout on token expiry

### Performance Optimization

- Lazy loading for routes
- Component code splitting
- Virtual scrolling for large lists
- Debounced search inputs
- Cached API responses where appropriate

## Important Business Rules

1. **L2 ID** must be unique across all applications
2. **Status Calculation**: Automatically derived from sub-task progress
3. **Progress Stages**: 待启动 → 研发进行中 → 业务上线中 → 全部完成
4. **Date Validation**: Actual dates cannot be earlier than planned dates
5. **Permission Levels**:
   - Admin: Full system access
   - Manager: Department-level management
   - Editor: Edit assigned applications
   - Viewer: Read-only access

## Testing Strategy

- Unit tests for utilities and composables
- Component testing with Vue Test Utils
- E2E testing for critical user flows
- API mocking for development/testing

## Deployment

- Build generates static files
- Deploy behind Nginx for production
- Environment variables for API endpoints
- SSO integration configuration required

## UI Design Specifications

### Color Palette
- **Primary**: #667eea (Purple gradient with #764ba2)
- **Success**: #48bb78 (Green)
- **Warning**: #ed8936 (Orange)  
- **Danger**: #f56565 (Red)
- **Secondary**: #718096 (Gray)
- **Background**: #f7fafc
- **Border**: #e2e8f0

### Page Structure

#### 1. Dashboard (仪表盘)
- Statistics cards (Total/In Progress/Completed/Blocked)
- Progress charts (Line chart for trends, Pie chart for departments)
- Todo items with urgency highlighting
- Real-time notifications

#### 2. Application Management (应用管理)
- Advanced search/filter bar
- Data table with inline progress bars
- Batch operations support
- Pagination with 20 items per page

#### 3. My Tasks (我的任务) - Key Pain Point Solution
- Auto-filtered to current user's tasks only
- Urgency indicators (red/yellow/green)
- Quick update buttons
- Confirmation dialogs to prevent mis-operations

#### 4. Sub-task Management (子任务管理)
- Master-detail view
- Progress tracking per module
- Blocking status management
- Batch update capabilities

#### 5. Audit Log (审计日志) - Unlimited Records
- No 1000-record limitation
- Advanced filtering (table/operation/user/date)
- Diff view for changes
- Rollback functionality

#### 6. Batch Import (批量导入)
- Step-by-step wizard (4 steps)
- Drag & drop file upload
- Data validation preview
- Import modes: Append/Replace/Update

#### 7. Reports Center (报表中心)
- Multiple report types (Summary/Progress/Delay/Department)
- Interactive charts
- Export to Excel/PDF
- Custom date ranges

### UI Components

#### Status Badges
- 待启动 (Pending): Gray background
- 进行中 (In Progress): Blue background
- 已完成 (Completed): Green background
- 阻塞中 (Blocked): Red background

#### Button Styles
- Primary: Gradient background (#667eea → #764ba2)
- Secondary: Gray (#e2e8f0)
- Success: Green (#48bb78)
- Warning: Orange (#ed8936)
- Danger: Red (#f56565)

#### Form Elements
- Rounded corners (6px)
- Border color: #cbd5e0
- Focus state: Primary color border
- Consistent padding: 10px

## Implementation Work Plan

### Phase 1: Project Setup & Core Infrastructure (Week 1)
1. **Initialize Vue 3 + Vite project**
   - Setup TypeScript configuration
   - Configure path aliases
   - Setup ESLint & Prettier

2. **Install and configure dependencies**
   - Element Plus UI library
   - Pinia for state management
   - Vue Router for navigation
   - Axios for API calls
   - Day.js for date handling
   - XLSX.js for Excel operations

3. **Setup base architecture**
   - Create folder structure
   - Configure router with lazy loading
   - Setup Pinia stores structure
   - Create API service layer
   - Setup authentication interceptors

### Phase 2: Layout & Navigation (Week 1)
1. **Create layout components**
   - MainLayout with header/sidebar/content
   - Navigation menu component
   - User profile dropdown
   - Notification center

2. **Implement routing structure**
   - Public routes (login)
   - Protected routes with guards
   - Role-based route access

### Phase 3: Core Features Implementation (Weeks 2-3)

#### Dashboard Page
- Statistics cards component
- Charts integration (ECharts/Chart.js)
- Todo list component
- Real-time data updates

#### Application Management
- ApplicationList component with table
- Search/filter functionality
- CRUD operations
- Excel export feature

#### My Tasks Feature (Priority)
- Auto-filter by current user
- Task cards with urgency levels
- Quick update forms
- Confirmation dialogs

#### Sub-task Management
- Master-detail layout
- Progress tracking
- Status update forms
- Batch operations

### Phase 4: Advanced Features (Week 4)

#### Audit Log System
- Infinite scroll or pagination
- Advanced filtering
- Diff viewer component
- Rollback confirmation dialog

#### Batch Import
- File upload component
- Step wizard component
- Data preview table
- Validation results display

#### Reports Module
- Chart components
- Export functionality
- Custom date range picker
- Report templates

### Phase 5: Integration & Testing (Week 5)
1. **API Integration**
   - Connect all endpoints
   - Error handling
   - Loading states
   - Retry mechanisms

2. **SSO Integration**
   - Token management
   - Auto-refresh mechanism
   - Session timeout handling

3. **Testing**
   - Unit tests for utilities
   - Component testing
   - E2E test scenarios
   - Performance testing

### Phase 6: Optimization & Deployment (Week 6)
1. **Performance Optimization**
   - Code splitting
   - Lazy loading
   - Virtual scrolling for large lists
   - API response caching

2. **Production Build**
   - Environment configurations
   - Build optimization
   - Bundle size analysis

3. **Deployment**
   - Docker configuration
   - Nginx setup
   - CI/CD pipeline
   - Monitoring setup

## Key Implementation Notes

### Pain Points to Address
1. **User Task Confusion**: Implement smart filtering to show only relevant tasks
2. **Audit Log Limitations**: Use database instead of Excel, no record limits
3. **Data Entry Errors**: Add confirmation dialogs and validation
4. **Progress Tracking**: Real-time calculation and visual indicators

### Technical Decisions
- Use Composition API for all components
- Implement virtual scrolling for tables > 100 rows
- Use WebSocket for real-time updates (optional)
- Cache API responses with 5-minute TTL
- Implement optimistic UI updates

### Development Priorities
1. Core CRUD operations
2. My Tasks feature (pain point solution)
3. Audit logging system
4. Excel import/export
5. Advanced reporting
# Dashboard Development Handover

## Overview
This document outlines the current status and next steps for the ClimaticPRO Dashboard ecosystem (Client, Installer, and Admin). Use this as the primary reference when continuing development.

## Architecture
- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL (Docker container `climaticpro-postgres-1`)
- **ORM**: Prisma (`/frontend/prisma/schema.prisma`)
- **Authentication**: `AuthContext` (JWT/Session based, currently mock/local logic).
- **Styling**: TailwindCSS
- **Deploy**: Docker Compose (`climaticpro-frontend` service)

## Current Status by Module

### 1. Installer Portal (`/cont/instalator`)
**Status**: ✅ Mostly Complete
- **Features Implemented**:
    -   **My Jobs**: Real data fetch from `/api/installer/jobs`.
    -   **Job Workflow**: Verification, Materials Logging, Warranty (Internal/External SNs), Finalization.
    -   **History**: List of completed jobs with summary stats.
    -   **Settings**: Profile management (CUI, Bank, formatted Warranty text).
    -   **PDF Generation**: Warranty Certificates and Invoices generated via `@react-pdf/renderer`.
- **Pending / Refinements**:
    -   [ ] **Advanced Filters**: Implement Date Range filter in History.
    -   [ ] **"With Extra Pipe" Filter**: Boolean filter for jobs with extra materials.

### 2. Client Portal (`/cont/client` or `/cont`)
**Status**: 🚧 Partially Implemented
- **Features Implemented**:
    -   Basic Layout and Auth protection.
- **Pending / Next Steps**:
    -   [ ] **Dashboard Overview**: Summary of active orders, notifications.
    -   [ ] **Order List**: Fetch and display client's WooCommerce orders.
    -   [ ] **Order Detail**: View specific order, download generated Invoice/Warranty (from Installer input).
    -   [ ] **Service Requests**: Form to request maintenance/repairs.

### 3. Super Admin & Dispatch (`/cont/admin`)
**Status**: 🚧 In Progress
- **Features Implemented**:
    -   **Stock Management**: Manage consumable inventory (CRUD).
    -   **Installer Management**: List/Approve installers.
    -   **B2B Marketplace**: Grid view for installers to buy consumables.
    -   **B2B Ordering**: "Trimite Comanda" generates PDF and emails supplier.
- **Pending / Next Steps**:
    -   [ ] **Role Logic**: Harden `AuthContext` to strictly enforce `admin` vs `super_admin` vs `installer`.
    -   [ ] **Order Dispatch (Broadcast)**:
        -   Refine "Broadcast" UI to select multiple installers or specific Zones.
        -   Implement "Accept Job" race condition handling (first come, first served).
        -   Connect "Broadcast" status to WooCommerce Order Status (e.g., custom status `wc-broadcasted`).

### 4. B2B Marketplace Refinements
**Status**: ⚠️ Needs Optimization
- **Current Issue**: Category counts in sidebar are inconsistent.
- **Next Steps**:
    -   [ ] **Fix Sidebar Counts**: Ensure queries match available stock/products.
    -   [ ] **Supplier Management**: UI to Add/Edit Suppliers directly in Admin.

## Technical Context & commands

### Database & Prisma
The project uses Prisma with PostgreSQL.
- **Schema**: Located at `frontend/prisma/schema.prisma`.
- **Studio**: Run `npx prisma studio` to view DB data.
- **Migration**: If you change the schema, run:
    ```bash
    npx prisma migrate dev --name <migration_name>
    ```

### Running the Project
The project runs in Docker.
- **Start**: `docker compose up -d`
- **Rebuild Frontend**: `docker compose up -d --build --force-recreate frontend` (Required for new dependencies or Env vars)
- **Logs**: `docker compose logs -f frontend`

### Key Files
- **Auth**: `frontend/contexts/AuthContext.tsx`
- **API Routes**: `frontend/app/api/...`
- **Installer Layout**: `frontend/app/[locale]/cont/instalator/layout.tsx`
- **PDF Templates**: `frontend/components/pdf/...`

## Immediate Todo for New Agent
1.  **Client Portal**: Build the "Order List" page fetching data from `lib/woo-admin.ts` (or mapped Prisma orders).
2.  **Admin Dispatch**: Finalize the "Broadcast" button logic to actually notify installers (simulated via DB status update for now).
3.  **Verify Roles**: Ensure a specific "Client" user cannot access `/cont/admin` routes.

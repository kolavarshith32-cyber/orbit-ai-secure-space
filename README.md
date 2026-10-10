# Orbit Ai Secure Space

Build a modern, production-oriented SaaS web application called **Orbit AI**.

## 1. Project Overview

Orbit AI is a secure, multi-tenant AI chatbot platform that allows multiple companies to use AI in separate, isolated workspaces.

Each company must have its own:

* Users and team members
* AI conversations and chat history
* Knowledge base and uploaded documents
* Workspace settings
* Access permissions
* AI configuration
* Usage statistics

The most important requirement is strict data isolation between companies.

Company A must never be able to access Company B's conversations, documents, users, or private information.

Build a functional application, not just a static dashboard or UI prototype.

## 2. Technology Stack

Use:

* React
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui components
* Supabase for authentication, PostgreSQL database, and storage
* Supabase Row-Level Security (RLS) for tenant isolation
* Lovable's supported AI integration or a securely configured server-side AI API

Use reusable components and a clean project structure.

## 3. Design and Branding

Product name: Orbit AI

Design a premium enterprise SaaS interface.

Visual style:

* Dark navy background
* Purple and cyan accent colors
* Clean typography
* Subtle gradients
* Rounded cards
* Thin borders
* Minimal shadows
* Professional dashboard layouts
* Responsive design for desktop, tablet, and mobile

Use a collapsible left sidebar on desktop and an appropriate mobile navigation menu.

The application should feel like a polished enterprise product.

Avoid excessive gradients, unnecessary animations, and clutter.

## 4. Public Website

Create a public landing page with:

* Orbit AI logo
* Navigation bar
* Hero section
* Product description
* Key features
* Security features
* How it works
* Pricing section
* Frequently asked questions
* Footer

Hero headline:

"Your Company's Knowledge. Your Own AI Space."

Subtitle:

"Give every team a private AI workspace to securely chat with company knowledge, collaborate with colleagues, and get answers from internal documents."

Primary button: "Get Started"

Secondary button: "Explore Features"

Add a visual preview of the application dashboard.

Include pricing cards for Starter, Business, and Enterprise plans. Display clearly labeled illustrative prices that can be configured later.

Do not implement real billing yet.

## 5. Authentication

Implement functional authentication using Supabase Auth.

Include:

* Sign up
* Login
* Logout
* Forgot password
* Password reset
* Email verification
* Protected application routes
* Session persistence

After registration, guide users through creating their company workspace.

Never allow unauthenticated users to access private application pages or APIs.

## 6. Company Onboarding

Create a multi-step onboarding flow.

Step 1: Personal details

* Full name

Step 2: Company details

* Company name
* Company size
* Industry

Step 3: Workspace configuration

* Workspace name
* Preferred AI assistant name

Step 4: Completion

* Display a welcome message
* Redirect to the company dashboard

Create a unique company tenant record in the database.

The user who creates the company should become its owner.

Users must not be able to assign themselves an owner role in arbitrary existing companies.

Use secure server-side logic or database functions to validate workspace creation and membership.

## 7. Multi-Tenant Architecture

Implement a proper multi-tenant data model.

Create these database tables:

### organizations

Fields:

* id: UUID primary key
* name: text
* slug: text, unique
* industry: text, nullable
* company_size: text, nullable
* created_at: timestamp

### profiles

Fields:

* id: UUID primary key referencing the authenticated user
* full_name: text
* avatar_url: text, nullable
* created_at: timestamp

### organization_members

Fields:

* id: UUID primary key
* organization_id: UUID referencing organizations
* user_id: UUID referencing profiles
* role: enum containing owner, admin, member, viewer
* created_at: timestamp

Add a unique constraint on organization_id and user_id.

### conversations

Fields:

* id: UUID primary key
* organization_id: UUID
* user_id: UUID
* title: text
* created_at: timestamp
* updated_at: timestamp

### messages

Fields:

* id: UUID primary key
* conversation_id: UUID
* organization_id: UUID
* user_id: UUID, nullable for assistant messages
* role: enum containing system, user, assistant
* content: text
* created_at: timestamp

### documents

Fields:

* id: UUID primary key
* organization_id: UUID
* uploaded_by: UUID
* file_name: text
* storage_path: text
* file_type: text
* processing_status: text
* created_at: timestamp

### usage_events

Fields:

* id: UUID primary key
* organization_id: UUID
* user_id: UUID
* event_type: text
* quantity: numeric
* created_at: timestamp

Add appropriate indexes, foreign keys, constraints, and timestamps.

Use database migrations for schema changes.

## 8. Mandatory Tenant Security

Security is a core requirement, not an optional feature.

Implement PostgreSQL Row-Level Security on all tenant-owned tables.

Requirements:

* Every tenant-owned record must belong to an organization.
* Users can only access organizations where they have valid membership.
* Every database read and write must enforce tenant authorization.
* Members must not be able to access another organization's data by changing a URL, UUID, API request, or browser state.
* Users cannot grant themselves admin or owner permissions.
* Organization owners and admins can manage membership according to their roles.
* Regular members cannot manage organization security settings.
* Viewers cannot create, modify, or delete restricted resources.
* Messages must be accessible only through authorized conversations.
* Document storage must use private buckets and tenant-scoped access policies.
* File downloads must require authorization.
* Organization IDs provided by the client must never be treated as sufficient proof of authorization.

Create reusable authorization functions and carefully designed RLS policies.

Avoid recursive RLS policies on organization membership. If security-definer database functions are needed, configure a fixed search_path and restrict their execution permissions.

Do not expose Supabase service-role credentials to the browser.

Do not use

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://orbit-ai-secure-space.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9bcb3ae3-dcae-4f04-93b8-42a1aebdf853).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

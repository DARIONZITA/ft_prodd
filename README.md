*This project has been created as part of the 42 curriculum by efinda, dnzita, cgama, jbofengo.*

# Description

**ft_prodd(...)** is a full-stack web application designed to improve how developers collaborate on group projects, with a strong focus on the workflow commonly experienced by **42 students**.

The name reflects both its purpose and its roots: the `ft_` prefix follows the traditional naming convention used across 42 projects, *prodd* comes from *productivity*, and the trailing `d` references Unix daemons — symbolizing a system that continuously runs in the background, tracking progress and activity. The `(...)` notation is inspired by function syntax, reinforcing the project’s programming-oriented identity.

The main goal of **ft_prodd(...)** is to provide a centralized platform where users can **organize, track, and improve their project workflow**, reducing common issues such as poor coordination, lack of visibility, and last-minute surprises during evaluation.

While the platform is inspired by and tailored to the needs of 42 students, **it is open to any user** who wants to manage collaborative projects in a structured and efficient way.

The application combines task management, collaboration tools, and real-time features into a single environment. It allows multiple users to interact simultaneously, manage shared workspaces, and monitor project progress as it evolves.

## Key Features

- **Authentication & User Management**
  JWT-based sessions, OAuth 2.0 login via the 42 API, user profiles with avatars, a friendship system, and role-based permissions (admin, member, guest) within workspaces.

- **Workspace & Task Management**
  Collaborative workspaces with Kanban boards, columns, tasks, checklists, labels, and member assignments for full project visibility.

- **Communication & Real-Time**
  Live updates via WebSocket (Socket.IO), presence status, workspace chat, task comments with mentions, and emoji reactions.

- **Notifications & Advanced Search**
  Real-time notifications for all creation, update, and deletion events, with advanced filtering, sorting, and pagination.

- **System & Infrastructure**
  Public RESTful API with key authentication, rate limiting, and Swagger documentation; Docker containerization; Prisma ORM; and a custom React design system.





# Instructions

This section explains how to **set up, configure, and run** the project locally.

The project is fully containerized using **Docker** and managed through a **Makefile**, which provides a simplified interface for all commands.

---

## Prerequisites

Before running the project, make sure you have the following installed:

* **Docker**
* **Docker Compose**
* **Make**
* **OpenSSL** (used to generate TLS certificates for HTTPS)

> All services run inside containers, so no manual installation of Node.js, PostgreSQL, or other dependencies is required on the host machine.

---

## Project Setup

Clone the repository and navigate to the project root:

```bash
git clone <repository_url>
cd ft_prodd
```

---

## Environment Configuration

The project uses environment variables for configuration, and since the `.env` file is ignored by Git, it will not be present when cloning the repository.

A `.env.example` file located inside `config/` is provided as a **template**, containing all the required environment variable names. The values in this file are placeholders and must be configured before running the project.

Create a `.env` file inside the `config/` directory and define all variables based on `.env.example`:

```bash
cp config/.env.example config/.env
```

Then edit the file and replace all placeholder values with your desired configuration.

---

## Running the Project

### Initial Setup (one-time)

```bash
make setup
```

This single command will:

1. Generate **TLS certificates** for local HTTPS
2. Check if Docker is running
3. Create `.env` from `.env.example` if none exists, then **pause** and wait for you to configure it
4. Stop any existing containers
5. Build all Docker images
6. Start all containers
7. Verify service health

> After `make setup` completes, the application is already running.

---

### Common Commands

```bash
make up      # Start all services
make down    # Stop all services
make restart # Restart all services
make logs    # Follow logs of all services
make ps      # Show container status
make info    # Show service URLs and access info
```

---

### Rebuilding Services

```bash
make rebuild          # Rebuild all services from scratch
make rebuild-backend  # Rebuild only the backend
make rebuild-frontend # Rebuild only the frontend
```

---

### Database

```bash
make prisma-studio  # Open Prisma Studio (GUI for the database)
```

---

### Maintenance

```bash
make clean      # Remove all containers, volumes, and images
make reset-all  # Full clean + fresh setup (wipes everything)
```

---

## Project Structure (Overview)

```bash
backend/
frontend/
config/
scripts/
Makefile
```

* **config/docker-compose.yaml** → Defines all services
* **scripts/** → Helper scripts used by the Makefile

---

## Notes

* The project is designed to run with a **single command** (`make setup`) as required by the subject.
* All services run inside Docker containers.
* The Makefile abstracts Docker commands to provide a simpler and consistent workflow.





# Resources

In this section, you have access to the main resources that helped us develop this project:

## Team Organization and Project Management

- [Project Manager vc Product Owner](https://youtu.be/2DwP_3gBGeQ?si=LaIiU4pE2RX_cpnD) — Youtube

- [Product Manager vs Project Manager - Project Management Training](https://youtu.be/WGvj_I2L020?si=HpxTi7Bkj9ocWPpb) — Youtube

- [Product Owner or Tech Lead, Not Both](https://chris-hand.medium.com/product-owner-lead-engineer-absolute-power-c00323c96b66) — Medium

- [Scrum vs Kanban - What's the Difference?](https://youtu.be/rIaz-l1Kf8w?si=qtOJpXPLZoCcXz0h) — Youtube

- [Basics of Kanban Boards for Project Management with Ricardo Vargas](https://youtu.be/XpK1vXM5Dd0?si=2e1jMqJp8zzNrkUs) — Youtube

- [What is a sprint (software development)?](https://www.techtarget.com/searchsoftwarequality/definition/Scrum-sprint) — TechTarget

- [Trello Tutorial in Ten Minutes (How to Use Trello to Get Your Life Together)](https://youtu.be/en3z928rwus?si=SJI1De0LO2RZApAj) — Youtube


## Frontend

- [How browsers work](https://web.dev/articles/howbrowserswork) — web.dev

- [The State of State Management in React (useState, Context API, Zustand...)](https://www.youtube.com/watch?v=qqqyUTTS-9g) — Youtube

- [React Query Crash Course - Learn Queries, Mutations, Caching, Optimistic Updates...](https://www.youtube.com/watch?v=e74rB-14-m8) — Youtube

- [React State Management in 2025: What You Actually Need](https://www.developerway.com/posts/react-state-management-2025) — developerway

- [Quickstart Guide](https://dndkit.com/quickstart/) — dndkit

- [Graph vs Chart: What’s the Difference?](https://blacklabel.net/blog/data-visualization/chart-types/graph-vs-chart-whats-the-difference/) — blacklabel.net

### AI Usage

- 


## Backend

- [CI/CD Explained: The DevOps Skill That Makes You 10x More Valuable](https://www.youtube.com/watch?v=AknbizcLq4w) — Youtube

- [Teste de integração no Node com Jest e SuperTest](https://www.youtube.com/watch?v=L9rHlPtNi3g) — Youtube

- [Criando testes na aplicação com Jest e SuperTest - Code/drops #93](https://www.youtube.com/watch?v=18Dgf7lb9QA) — Youtube

- [Crypto module](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback) — nodejs.org

### AI Usage

- **Public API:** it helped to design and implement the API with code snippets for secure key authentication (creation and storage) and rate limiting in Express, together with a comprehensive documentation.

- **OAuth 2.0:** it helped implement the OAuth 2.0 authentication flow, including user redirection to the 42 authorization page, callback handling, authorization code exchange, access token retrieval, and user information fetching from the 42 API.

- **WebSocket (Socket.IO):** it helped implement and design the real-time features using Socket.IO, including event handling for task comments, notifications, and user presence updates, user connection management, and broadcasting events to relevant users in workspaces.

- **SignIn and SignUp:** it helped implement the authentication system, including password hashing with bcrypt, JWT-based session authentication, request parsing and validation, TypeScript typing, and schema validation with Zod. It also helped structure the backend into routes, controllers, and middleware to improve maintainability and scalability.

## Database

- [Aprenda em 13:37: Prisma](https://www.youtube.com/watch?v=uApCW1gcpdE&t=16s) — Youtube

### AI Usage

- 





# Team Information

This section outlines the roles and core responsibilities of each team member within the project.

---

## *efinda* — Project Manager & Developer

* Oversees project planning, coordination, and progress tracking
* Ensures team communication and alignment
* Contributes to both frontend and backend development

---

## *dnzita* — Product Owner & Developer

* Defines product vision and feature priorities
* Manages and validates the project backlog
* Contributes to both frontend and backend development

---

## *cgama* — Technical Lead & Backend Developer

* Designs system architecture and technical decisions
* Defines development standards and best practices
* Leads backend development and infrastructure setup

---

## *jbofengo* — Backend Developer

* Implements backend features and APIs
* Ensures code quality and reliability on the server side
* Supports testing and backend maintenance

---





# Project Management

## How We Organize Our Work

We follow the **Agile Kanban methodology** to manage our workflow efficiently. Our process works like this:

At the project's start, we break down all required work into small, manageable tasks — what we call "**salami slicing**" the work. These slices are distributed across team members based on their specific roles (PM, PO, Tech Lead, Dev).

**Our bi-weekly meeting rhythm:**

- **Monday @ 12:00 PM - Sprint Planning:** We select task slices from the backlog and distribute them among team members to work on throughout the week. Each member knows exactly what they need to "eat" (complete) before Friday.

- **Friday @ 6:00 PM - Sprint Review:** We check if all the salami slices distributed on Monday were successfully "eaten" (completed). Members demonstrate their completed work, the Product Owner validates functionality, and the Technical Lead reviews code quality.

This cadence keeps everyone accountable and ensures continuous progress without overwhelming any single team member.

## Project Management Tools

We use **Trello** as our Kanban board platform. The board is shared among all team members, providing complete visibility into the project's state.

Our Trello board structure:
- **Backlog** - All upcoming tasks waiting to be picked up
- **To Do** - Tasks assigned for the current sprint
- **Doing** - Work currently being developed
- **Blocked** - Tasks put on hold due to dependencies missing
- **Review** - Completed work awaiting validation
- **Done** - Validated and merged work
- **Modules** - Checklist of the modules

Team members move their assigned cards across columns as they progress, giving everyone real-time visibility into what's being worked on, what's blocked, and what's completed.

## Communication Channels

We use a **two-channel communication strategy** to balance urgency and organization:

### **WhatsApp Group - Quick Communication**
Used for time-sensitive messages and urgent coordination. Since most team members check WhatsApp frequently throughout the day, it's our go-to for:
- Urgent blockers or issues
- Last-minute meeting changes
- Quick yes/no questions
- General team coordination

### **Slack Workspace - Structured Work Discussion**
Our primary platform for organized, topic-specific communication. The workspace is divided into focused channels:

- **#avisos** - Team-wide announcements and important updates
- **#standup-check-in** - Weekly progress updates (mandatory Wednesday check-in)
- **#frontend** - React, UI/UX, and component discussions
- **#backend** - API, database, and server-side topics
- **#devops** - Docker, deployment, and infrastructure
- **#review** - Features reviews and technical feedback
- **#docs-and-resources** - Documentation, tutorials, and learning materials

This dual-channel approach ensures we never miss urgent issues (WhatsApp) while keeping technical discussions organized and searchable (Slack).





# Technical Stack

The technology stack was selected to ensure efficient development within a 4-person team, while meeting all subject requirements and supporting a scalable, real-time, multi-user application.

---

## Frontend

* **Framework:** React (with Vite)
* **Styling:** Tailwind CSS

React provides a component-based architecture suitable for building dynamic user interfaces, while Vite ensures fast development and build performance. Tailwind CSS enables rapid UI development with a consistent and maintainable design system.

---

## Backend

* **Runtime & Framework:** Node.js with Express

Express is a lightweight and flexible backend framework used to build RESTful APIs. It integrates easily with real-time communication layers and middleware for authentication, security, and request handling.

---

## Database

* **System:** PostgreSQL

PostgreSQL was chosen for its reliability, strong consistency, and support for relational data models. It is well-suited for multi-user environments and complex queries, ensuring data integrity across the application.

---

## Additional Technologies

* **ORM:** Prisma
* **Real-Time Communication:** Socket.IO
* **Authentication:** JWT + bcrypt
* **Containerization:** Docker + Docker Compose
* **Reverse Proxy / HTTPS:** Nginx

Prisma simplifies database interaction through type-safe queries and automated migrations. Socket.IO enables real-time features such as chat and live updates. JWT and bcrypt provide secure authentication mechanisms. Docker ensures consistent environments and allows the application to run with a single command. Nginx handles HTTPS and request routing.

---

## Justification of Technical Choices

The stack is based on a unified **TypeScript ecosystem**, allowing both frontend and backend to share the same language. This reduces context switching and improves team collaboration.

A **monolithic architecture** was chosen to simplify development, deployment, and debugging within the project’s time constraints. It minimizes system complexity while maintaining sufficient flexibility for all required features.

The combination of **React, Express, and PostgreSQL** provides a balanced architecture capable of handling real-time interactions, structured data, and multi-user concurrency.

---

## Compatibility with Subject Requirements

| Requirement        | Technology Used             |
| ------------------ | --------------------------- |
| Frontend Framework | React + Vite                |
| Backend Framework  | Express (Node.js)           |
| Database           | PostgreSQL                  |
| Real-time Features | Socket.IO                   |
| User Management    | JWT + bcrypt                |
| Security           | Helmet, CORS, Rate Limiting |
| Docker Deployment  | Docker Compose              |
| HTTPS              | Nginx                       |
| Multi-user Support | PostgreSQL                  |
| Architecture       | Monolithic (Express)        |





# Database Schema

The application uses **PostgreSQL** with **Prisma ORM**.
The schema is designed to support task management, workspace collaboration and real-time communication.

---

## Structure Overview

The database is organized around the following core concepts:

* **User**: Represents each platform user
* **Workspace**: Groups users, tasks, and collaborative data
* **Column**: Defines task organization within a workspace (Kanban structure)
* **Task**: Central entity representing work items

Additional tables handle relationships, communication, and public API features.

---

## Visual Representation

```mermaid
erDiagram
    User ||--o{ WorkspaceMember : joins
    Workspace ||--o{ WorkspaceMember : contains

    Workspace ||--o{ Column : contains
    Column ||--o{ Task : organizes

    Task ||--o{ TaskAssignment : assigned
    User ||--o{ TaskAssignment : receives

    Task ||--o{ ChecklistItem : contains
    Task ||--o{ Comment : receives
    User ||--o{ Comment : writes

    Comment ||--o{ CommentMention : mentions
    User ||--o{ CommentMention : mentioned

    User ||--o{ Notification : receives
    Task ||--o{ Notification : references
    Workspace ||--o{ Notification : references

    Workspace ||--o{ ChatMessage : contains
    User ||--o{ ChatMessage : sends

    User ||--o{ Reaction : reacts
    ChatMessage ||--o{ Reaction : receives
    Comment ||--o{ Reaction : receives

    Workspace ||--o{ Label : defines
    Task ||--o{ TaskLabel : classifies
    Label ||--o{ TaskLabel : links

    User ||--o{ UserBadge : earns
    Badge ||--o{ UserBadge : awarded

    User ||--o{ UserXP : accumulates
    Workspace ||--o{ ActivityLog : records
    User ||--o{ ActivityLog : performs

    User ||--o{ LeaderboardEntry : appears_in
    Workspace ||--o{ LeaderboardEntry : contains
```

---

## Tables and Relationships

### Core Entities

| Table             | Description                          | Key Fields                                             |
| ----------------- | ------------------------------------ | ------------------------------------------------------ |
| `User`            | Platform users                       | `id`, `username`, `email`, `passwordHash`, `createdAt` |
| `Workspace`       | Collaborative workspace              | `id`, `name`, `description`, `createdAt`               |
| `WorkspaceMember` | Links users to workspaces with roles | `id`, `workspaceId`, `userId`, `role`                  |

---

### Task Management (Kanban)

| Table            | Description                      | Key Fields                                                |
| ---------------- | -------------------------------- | --------------------------------------------------------- |
| `Column`         | Task grouping inside a workspace | `id`, `workspaceId`, `name`, `order`                      |
| `Task`           | Main task entity                 | `id`, `columnId`, `title`, `description`, `orderInColumn` |
| `TaskAssignment` | Assigns tasks to users           | `taskId`, `userId`                                        |
| `ChecklistItem`  | Task checklist items             | `id`, `taskId`, `text`, `isCompleted`                     |
| `Label`          | Reusable labels                  | `id`, `workspaceId`, `name`, `color`                      |
| `TaskLabel`      | Task-label relationship          | `taskId`, `labelId`                                       |

---

### Communication and Activity

| Table            | Description               | Key Fields                                 |
| ---------------- | ------------------------- | ------------------------------------------ |
| `Comment`        | Task comments             | `id`, `taskId`, `authorId`, `content`      |
| `CommentMention` | User mentions in comments | `id`, `commentId`, `userId`                |
| `Notification`   | System notifications      | `id`, `userId`, `type`, `isRead`           |
| `ChatMessage`    | Workspace chat messages   | `id`, `workspaceId`, `senderId`, `content` |
| `Reaction`       | Emoji reactions           | `id`, `emoji`, `userId`                    |
| `ActivityLog`    | User actions history      | `id`, `workspaceId`, `userId`, `action`    |

---

## Data Types

The schema uses the following main data types:

* **Int**: identifiers, ordering, ranking, XP values
* **String**: names, descriptions, content, URLs
* **Boolean**: state flags (e.g., `isCompleted`, `isRead`)
* **DateTime**: timestamps for entity creation and updates

### Enums

* `WorkspaceRole`: `admin`, `member`, `guest`
* `NotificationType`: `friendship`, `workspace`, `task`, `mention`

---

## Modeling Rules

* All entities use an auto-increment `id` as the primary key
* `email` and `username` in `User` are unique
* Many-to-many relationships are handled through junction tables
* Optional fields are used to support flexible relationships (e.g., notifications and reactions)





# Features List

This section lists all implemented features of the project, along with their description and responsible team members.

---

## Authentication & User Management

| Feature                         | Description                                                                                                             | Implemented By                        |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| **User Authentication**         | Register, log in, and authenticate using JWT-based sessions and password hashing (bcrypt).                               | efinda (Frontend), jbofengo (Backend) |
| **OAuth 2.0 Authentication**    | Log in using 42 API credentials via the OAuth 2.0 authorization flow.                                                   | efinda (Frontend), jbofengo (Backend) |
| **User Profiles**               | Profile management with personal information, avatar upload, and default avatar assignment at signup.                     | efinda                                |
| **Friendship System**           | Send, accept, and remove friend requests; view friends list and their online status on each profile.                     | efinda                                |
| **Social Discovery**            | Browse workspaces your friends are members of to discover and request to join collaborative projects.                     | efinda                                |
| **Advanced Permissions System** | Role-based access control (admin, member, guest) with role-specific views and actions within workspaces.                | efinda, cgama (Backend), dnzita (Frontend) |

---

## Workspace & Task Management

| Feature                    | Description                                                                                         | Implemented By                        |
| -------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------- |
| **Workspace Management**   | Create, update, delete, and browse collaborative workspaces with membership management.              | efinda, cgama (Backend), dnzita (Frontend) |
| **Kanban Board**           | Visual task organization using columns to represent workflow stages within each workspace.           | efinda, cgama (Backend), dnzita (Frontend) |
| **Task CRUD**              | Create, update, delete, and reorder tasks across columns.                                           | efinda, cgama (Backend), dnzita (Frontend) |
| **Task Assignment**        | Assign tasks to one or multiple workspace members.                                                   | efinda, cgama (Backend), dnzita (Frontend) |
| **Task Checklist**         | Add checklist items to tasks and track their completion status.                                     | efinda, cgama (Backend), dnzita (Frontend) |
| **Task Labels**            | Categorize tasks using color-coded labels for better organization.                                  | efinda, cgama (Backend), dnzita (Frontend) |

---

## Communication & Real-Time

| Feature                              | Description                                                                                    | Implemented By                        |
| ------------------------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------- |
| **Real-Time WebSocket Infrastructure** | Persistent Socket.IO connections enabling live updates across the platform.                    | dnzita (Frontend), jbofengo (Backend) |
| **Real-Time Collaborative Features**    | Live synchronization of task comments and workspace data for all connected users.              | efinda, cgama (Backend), dnzita (Frontend) |
| **Presence System**                  | View online/offline status of friends in real time.                                            | dnzita (Frontend), jbofengo (Backend) |
| **Workspace Chat**                   | Real-time messaging system within workspaces.                                                  | efinda (Backend), dnzita (Frontend)   |
| **Task Comments & Mentions**         | Comment on tasks with @mentions to notify other workspace members.                             | efinda (Backend), dnzita (Frontend)   |
| **Reactions**                        | React to messages and comments using emojis.                                                   | efinda (Backend), dnzita (Frontend)   |

---

## Notifications

| Feature                   | Description                                                                                                 | Implemented By                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| **Notification System**   | Real-time notifications delivered via Socket.IO for all creation, update, and deletion events.               | efinda (Backend), dnzita (Frontend)   |
| **Advanced Search**       | Filter, sort, and paginate notifications by type (mentions, task, workspace, friendship), date, and status. | efinda (Backend), dnzita (Frontend)   |

---

## System & Infrastructure

| Feature                    | Description                                                                       | Implemented By         |
| -------------------------- | --------------------------------------------------------------------------------- | ---------------------- |
| **Public API**             | RESTful API secured with API key authentication, rate limiting, and Swagger documentation. | efinda (Frontend), jbofengo (Backend) |
| **Dockerized Environment** | Full application runs in containers with a single command.                        | cgama                  |
| **ORM Integration**        | PostgreSQL database managed through Prisma ORM with type-safe queries and migrations. | dnzita                 |
| **Secure API**             | Backend secured with middleware (JWT, CORS, Helmet, rate limiting).               | jbofengo               |
| **Custom Design System**   | Consistent UI built with reusable React components, color palette, typography rules, and shared icons. | efinda, dnzita (Frontend) |





# Modules

This section lists all selected modules for the project, including their type, point value, implementation details, and responsible team members.

---

## Modules Overview

| Category                   | Module                                                                                                                    | Type                | Points |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------ |
| Web                        | Use a framework for both the frontend and backend                                                                         | Major               | 2      |
|                            | Implement real-time features using WebSockets or similar technology                                                       | Major               | 2      |
|                            | Allow users to interact with other users                                                                                  | Major               | 2      |
|                            | A public API to interact with the database with a secured API key, rate limiting, documentation, and at least 5 endpoints | Major               | 2      |
|                            | Use an ORM for the database                                                                                               | Minor               | 1      |
|                            | A complete notification system for all creation, update, and deletion actions                                             | Minor               | 1      |
|                            | Real-time collaborative features                                                                                          | Minor               | 1      |
|                            | Custom-made design system with reusable components, including a proper color palette, typography, and icons               | Minor               | 1      |
|                            | Implement advanced search functionality with filters, sorting, and pagination                                             | Minor               | 1      |
| User Management            | Standard user management and authentication                                                                               | Major               | 2      |
|                            | Implement remote authentication with OAuth 2.0                                                                            | Minor               | 1      |
|                            | Advanced permissions system                                                                                               | Major               | 2      |
|                            | An organization system                                                                                                    | Major               | 2      |
| **Total**                  | 19                                                                                                                        | 7 Maj. / 6 Min.     | 20     |

---

## Module Details

### Use a framework for both the frontend and backend

* **Justification:**
  Using frameworks for both frontend and backend accelerates development by providing structured architectures, reusable components, and built-in solutions for common problems. This allows the team to focus on implementing features rather than low-level setup.

* **Implementation:**
  The project uses:

  * **React (with Vite)** for the frontend, implementing a component-based architecture to build dynamic user interfaces
  * **Express (Node.js)** for the backend, providing a structured API with routing, middleware, and request handling

  The frontend communicates with the backend through HTTP APIs and real-time communication (Socket.IO), forming a complete client-server architecture.

* **Team:**

  * efinda, dnzita (Frontend)
  * cgama, jbofengo (Backend)

---

### Implement Real-Time Features Using WebSockets or Similar Technology

* **Justification:**
  Real-time communication enhances collaboration by allowing users to receive updates instantly without manually refreshing the application. This creates a more interactive and responsive experience, particularly in a collaborative task management platform where multiple users may be working simultaneously.

* **Implementation:**
  The project implements real-time communication using **Socket.IO**, enabling the server to push updates directly to connected clients.

  * **Presence System:** Users can view the online or offline status of their friends in real time.

  * **Task Comments:** Comments added to workspace tasks are immediately displayed to all connected users without requiring a page refresh.

  * **Notifications:** User notifications are delivered and updated instantly in the browser, ensuring that important events are communicated as they occur.

  By relying on persistent connections rather than periodic polling, the application provides a more efficient and responsive collaborative experience.

* **Team:**

  * dnzita (Frontend)
  * jbofengo (Backend)

---

### Allow Users to Interact with Other Users

* **Justification:**
  Enabling user interaction is a core requirement for collaborative platforms, as it allows users to communicate, share information, and build connections within the application. This improves engagement and supports teamwork within and across workspaces.

* **Implementation:**

  The project implements full user interaction capabilities, covering chat, profile, and friends systems.

  * **Basic Chat System:** A real-time messaging system allows users to send and receive direct messages within the workspace task comments, where they can mention other workspace users about updates on the task. These comments are delivered instantly using **Socket.IO**, ensuring real-time communication between connected users.

  * **Profile System:** Each user has a dedicated profile page displaying their information, including username, avatar, and social relationships.

  * **Friends System:** Users can send, accept, and remove friend requests. The friends list is visible on each user profile, and online status is displayed when applicable.

* **Team:**

  * Profile & Friends System: efinda (Frontend + Backend)
  * Basic Chat System: efinda (Backend), dnzita (Frontend)

---

### A Public API to Interact with the Database with a Secured API Key, Rate Limiting, Documentation, and at Least 5 Endpoints

* **Justification:**
  Providing a public API allows external applications to interact with the database securely. API key authentication and rate limiting ensure controlled access and prevent abuse, while proper documentation simplifies integration for third-party developers.

* **Implementation:**
  The backend exposes a RESTful API for workspace management, including **create**, **list**, **retrieve**, **update**, and **delete** operations.

  * **API Key Authentication:** Access is protected through user-generated API keys obtained after authentication. Keys are securely stored as **bcrypt hashes**, displayed only once upon creation, and can be revoked or regenerated by the user.

  * **Rate Limiting:** Requests are limited using the *express-rate-limit* middleware, with separate quotas for read and write operations. When the limit is exceeded, the API responds with **HTTP 429 (Too Many Requests)**.

  * **Documentation:** The API is documented using Swagger, providing interactive documentation and usage examples.

* **Team:**

  * efinda (Frontend)
  * jbofengo (Backend)

---

### Use an ORM for the Database

* **Justification:**
  Using an ORM simplifies database interaction by abstracting raw SQL queries into a structured and type-safe API. This reduces the risk of errors, improves code maintainability, and allows faster development, especially in a team environment.

* **Implementation:**
  The project uses **Prisma ORM** to define the database schema and handle all database operations.

  * The schema is declared using Prisma’s declarative syntax
  * Migrations are managed through Prisma to keep the database structure consistent
  * All database queries (CRUD operations) are performed through Prisma Client, ensuring type safety and validation

* **Team:** dnzita

---

### A Complete Notification System for All Creation, Update, and Deletion Actions

* **Justification:**
  A notification system improves user awareness by providing real-time updates about important changes in the application.

* **Implementation:**

  The project implements a notification system that tracks creation, update, and deletion events across the platform, including tasks, workspaces, and comments.

  Notifications are generated on the backend and delivered in real time using **Socket.IO**.

  On the frontend, users can view and track notifications in a dedicated interface, with updates appearing instantly without page refresh.

* **Team:**
  * efinda (Backend)
  * dnzita (Frontend)

---

### Real-time Collaborative Features

* **Justification:**
  Real-time collaboration enables multiple users to work simultaneously within shared environments, improving coordination and responsiveness in a team-based application.

* **Implementation:**

  The project implements real-time collaborative features within shared workspaces.

  Shared workspaces allow multiple users to collaborate on tasks simultaneously. Real-time updates are applied to task comments, ensuring that any change is immediately reflected for all connected users.

  This is achieved using **Socket.IO**, enabling live synchronization of comments without requiring page refresh.

  The system focuses on live collaboration within workspace task discussions, providing a responsive and synchronized editing experience.

* **Team:**
  * efinda, cgama (Backend)
  * dnzita (Frontend)

---

### Custom-made Design System with Reusable Components

* **Justification:**
  A custom design system ensures visual consistency across the application and improves development efficiency by promoting reusable UI components.

* **Implementation:**

  The project implements a custom design system on the frontend using **React reusable components**.

  It includes:
    * A consistent color palette applied across all pages
    * Defined typography rules for headings, text, and UI elements
    * A shared icon system used throughout the application
    * A library of reusable components (minimum 10), such as buttons, modals, inputs, cards, navigation elements, and layout components

  These components are reused across multiple pages of the application, ensuring a consistent user interface and reducing duplication of code.

* **Team:**
  - efinda, dnzita (Frontend)

---

### Implement Advanced Search Functionality with Filters, Sorting, and Pagination

* **Justification:**
  Advanced search functionality improves usability by allowing users to efficiently locate relevant information within large datasets. Combining filtering, sorting, and pagination provides a scalable and user-friendly way to browse notifications while reducing unnecessary data transfer between the backend and frontend.

* **Implementation:**
  The notification system implements advanced search capabilities through backend query parameters and frontend controls.

  * **Filtering** is supported by allowing users to retrieve notifications by their type (e.g., mentions, task, workspaces, and friendships).

  * **Sorting** is implemented by enabling notifications to be ordered chronologically, either **from newest to oldest** or **oldest to newest**, using configurable query parameters.

  * **Pagination** is handled through skip and take parameters, allowing notifications to be retrieved in configurable batches while also returning pagination metadata such as the total number of matching notifications.

  These operations are performed directly through Prisma queries, ensuring that filtering, sorting, and pagination are executed efficiently at the database level rather than in application memory.

* **Team:**

  * efinda (Backend)
  * dnzita (Frontend)

---

### Standard User Management and Authentication

* **Justification:**
  Standard user management provides the foundation for a collaborative application by allowing users to maintain their identity, personalize their profile, and interact with other members of the platform. The friendship system further encourages collaboration by helping users discover projects through their connections and request to join workspaces that match their interests.

* **Implementation:**
  The project implements a complete user management system with profile customization and social features.

  * **Profile Management:** Users can update their personal information through a dedicated profile page.

  * **Avatar Support:** Users may upload a custom avatar, while a default avatar is automatically assigned at signup.

  * **Friendship System:** Users can send and manage friendship requests, maintain a friends list, and view the online status of their friends.

  * **Social Discovery:** Each user profile displays the workspaces in which that user's friends are members, together with workspace descriptions, allowing users to discover projects and request to join them as collaborators or guests.

* **Team:** efinda

---

### Implement Remote Authentication with OAuth 2.0

* **Justification:**
  Implementing OAuth 2.0 allows users to authenticate using their existing accounts from popular providers (e.g., Google, GitHub), or in our case 42 API, improving user experience and security by leveraging trusted authentication systems.

* **Implementation:**
  The backend implements OAuth 2.0 authentication flow, allowing users to log in using their 42 credentials. The process includes:

  * Redirecting users to the 42 authorization page, using the appropriate client ID and scopes to request necessary permissions.
  * Handling the callback with the authorization code received from 42 API, using Zod to validate the incoming data and ensure it meets expected formats.
  * Exchanging the code for an access token to authenticate requests to the 42 API
  * Retrieving user information from the 42 API using the access token, and creating a local user session, and then redirecting the user to the frontend application with a JWT token for authenticated access, or an error message if authentication fails.

* **Team:**

  * efinda (Frontend)
  * jbofengo (Backend)

---

### Advanced Permissions System

* **Justification:**
  An advanced permission system is essential for collaborative workspaces, ensuring that each user can only perform actions appropriate to their responsibilities. By assigning different roles, the application maintains organization, prevents unauthorized modifications, and supports effective team collaboration.

* **Implementation:**
  The project implements a role-based access control system within each workspace, defining different permissions and views according to the user's role.

  * **Role Management:** Each workspace member is assigned one of three roles: **admin**, **member**, or **guest**.

  * **Administrative Permissions:** Workspace admins can manage membership by inviting or removing users and are responsible for administering the workspace.

  * **Role-Based Views and Actions:** The interface and available actions are dynamically adjusted according to the user's role, ensuring that only authorized operations are accessible.

  * **Workspace Visibility:** Members and guests can view the list of workspace participants, promoting transparency and facilitating collaboration among team members.

* **Team:**

  * efinda, cgama (Backend)
  * dnzita (Frontend)

---

### Organization System

* **Justification:**
  An organization system is fundamental to a collaborative task management platform, as it allows users to work together within shared spaces. By grouping members into workspaces, the application supports project coordination, task distribution, and collaborative development.

* **Implementation:**
  The project implements organizations through **workspaces**, which serve as collaborative environments for teams.

  * **Workspace Management:** Users can create, update, and delete workspaces, each with its own name and description.

  * **Membership Management:** Workspace administrators can invite users to join or remove existing members, enabling teams to evolve throughout the project's lifecycle.

  * **Organization Views:** Users can browse available workspaces, view their descriptions and members, and, depending on their permissions, perform actions such as creating, viewing, or updating workspace information.

  * **Collaboration:** Each workspace acts as an independent environment where members collaborate on tasks and other project-related activities.

* **Team:**

  * efinda, cgama (Backend)
  * dnzita (Frontend)





# Individual Contributions

This section provides a detailed breakdown of each team member’s contributions throughout the project, including implemented features, modules, and challenges encountered.

---

## efinda (Project Manager / Frontend Developer)

### Contributions

* Defined and presented the initial project idea
* Led project organization and coordination:

  * Created communication channels (WhatsApp, Slack workspace with structured channels and rules)
  * Set up project management tools (Trello Kanban board for planning and tracking progress)
  * Organized and led team meetings
* Defined development workflow:

  * Created commit message guidelines
  * Established code-review rules
  * Reviewed, validated, and merged code after approval
* Frontend development:

  * Implemented authentication interfaces
  * Developed user profile and social pages
* Documentation:

  * Structured and wrote the project README.md
  * Ensured documentation consistency and alignment with subject requirements

### Implemented Features / Modules

* User Authentication (Frontend)
* User Profiles
* Social / User Interaction Pages

---

### Challenges & Solutions

* **Challenge:** Coordinating a team workflow and maintaining consistency across contributions
* **Solution:** Defined clear guidelines (commit rules, code review process) and structured communication channels to ensure alignment
* **Challenge:** Maintaining clear and structured documentation throughout the project
* **Solution:** Designed an incremental README structure that is updated alongside development progress

---

## dnzita (Project Owner / Developer)

### Contributions

* Designed and conducted a user research form to gather requirements from students
* Analyzed form results and contributed to module selection
* Backend and frontend feature development:

  * Implemented notifications system
  * Developed workspace-related pages
* Designed the database schema using Prisma

### Implemented Features / Modules

* Notifications System
* Workspace Management
* Database Schema Design

---

### Challenges & Solutions

* **Challenge:** Translating user needs into concrete features and modules
* **Solution:** Structured feedback collection through forms and mapped results to actionable module decisions

---

## cgama (Technical Leader / Backend Developer)

### Contributions

* Designed the overall technical architecture of the project
* Selected the technology stack
* Set up the entire development environment:

  * Defined project structure
  * Created Dockerfiles and Docker Compose configuration
  * Implemented Makefile and automation scripts
* Established infrastructure for scalable and consistent development

### Implemented Features / Modules

* Project Infrastructure (Docker, Makefile, Scripts)
* System Architecture Design
* Technical Stack Definition

---

### Challenges & Solutions

* **Challenge:** Creating a development environment that is consistent across all team members
* **Solution:** Containerized the entire application using Docker and centralized commands through the Makefile

---

## jbofengo (Backend Developer)

### Contributions

* Implemented backend authentication logic
* Developed secure API endpoints for user authentication

### Implemented Features / Modules

* User Authentication (Backend)

---

### Challenges & Solutions

* **Challenge:** Ensuring secure authentication and proper handling of user credentials
* **Solution:** Implemented JWT-based authentication with password hashing using bcrypt

---

## Team Collaboration

### Contributions

* All team members participated in code reviews
* Collaboratively validated implementations before merging into the main codebase

# Git Commit Message Guidelines

We follow precise rules for git commit messages to ensure **readable history**, easy navigation through the **project timeline**, and clear communication between team members.

---

## Commit Message Format

Each commit message consists of a **header**, a **body** (optional), and a **footer** (optional).

The header has a special format that includes a **type**, a **scope**, and a **subject**:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

### Rules:
- The commit must be written in **English**
- The **header** is **mandatory**
- The **scope** is **optional** (but recommended)
- The **body** and **footer** are **optional**

---

## Type

Must be one of the following:

### **Core Development Types:**

* **feat**: A new feature for the user (e.g., new UI component, new API endpoint, new module)
  ```
  feat(kanban): add drag-and-drop for task cards
  feat(api): create workspace invitation endpoint
  ```

* **fix**: A bug fix (something that was broken and now works)
  ```
  fix(auth): resolve login failure with uppercase emails
  fix(frontend): correct responsive layout on mobile
  ```

* **improve**: Code improvements without changing functionality (refactoring, performance optimization, code style/formatting)
  ```
  improve(backend): extract validation logic into middleware
  improve(database): add indexes to frequently queried tables
  improve(frontend): lazy load chat component
  improve: format code with prettier and fix linting errors
  ```

### **Quality & Testing Types:**

* **test**: Adding or updating tests
  ```
  test(auth): add unit tests for JWT validation
  test(api): add integration tests for workspace endpoints
  ```

### **Infrastructure & Configuration Types:**

* **build**: Changes to build system or dependencies (package.json, Docker, webpack, etc.)
  ```
  build: add socket.io dependency
  build(docker): update PostgreSQL version to 15
  ```

* **ci**: Changes to CI/CD configuration (GitHub Actions, deployment scripts)
  ```
  ci: add automated tests to GitHub Actions
  ci: configure Docker deployment pipeline
  ```

* **chore**: Other changes that don't modify src or test files (updating .gitignore, configs, etc.)
  ```
  chore: update .env.example with OAuth keys
  chore: add .vscode settings for team
  ```

### **Documentation Type:**

* **docs**: Documentation changes (README, API docs, code comments, guides)
  ```
  docs(readme): add installation instructions
  docs(api): document authentication endpoints
  docs: add Privacy Policy and Terms of Service
  ```

### **Special Type:**

* **revert**: Reverting a previous commit
  ```
  revert: feat(chat): add emoji picker
  
  This reverts commit a1b2c3d4.
  The emoji picker was causing performance issues.
  ```

---

## Scope

The **scope** indicates which part of the project is affected.

### **Frontend Scopes:**

* **ui**: General UI components (buttons, inputs, modals, layouts)
  ```
  feat(ui): create reusable Card component
  style(ui): update color palette to match design system
  ```

* **auth/ui**: Authentication UI components and pages (login, register, password reset, OAuth buttons)
  ```
  feat(auth/ui): add Google OAuth login button
  fix(auth/ui): resolve email verification redirect
  improve(auth/ui): add password strength indicator
  ```

* **auth/api**: Authentication backend logic (JWT, sessions, OAuth, password hashing, endpoints)
  ```
  feat(auth/api): implement JWT token generation
  fix(auth/api): resolve OAuth callback handling
  improve(auth/api): optimize password hashing algorithm
  ```

* **profile**: User profile pages and components
  ```
  feat(profile): add avatar upload functionality
  fix(profile): correct friends list display
  ```

* **workspaces**: Workspace-related UI (workspace dashboard, settings, members)
  ```
  feat(workspaces): implement workspace creation modal
  improve(workspaces): simplify member list component
  ```

* **kanban**: Kanban board components (board, columns, task cards, drag-and-drop)
  ```
  feat(kanban): add drag-and-drop for tasks
  perf(kanban): optimize rendering for large boards
  ```

* **chat**: Chat interface and real-time messaging UI
  ```
  feat(chat): add typing indicators
  fix(chat): resolve scroll position on new messages
  ```

* **notifications**: Notification components and UI
  ```
  feat(notifications): add notification dropdown
  style(notifications): improve badge positioning
  ```

* **gamification**: Badges, achievements, leaderboards UI
  ```
  feat(gamification): display user badges on profile
  feat(gamification): create leaderboard page
  ```

### **Backend Scopes:**

* **api**: General API endpoints and routing
  ```
  feat(api): create RESTful workspace endpoints
  improve(api): standardize error response format
  ```

* **database**: Database schema, migrations, models
  ```
  feat(database): create notifications table
  improve(database): optimize user queries with indexes
  ```

* **websocket**: WebSocket/Socket.io implementation (real-time features)
  ```
  feat(websocket): implement chat message broadcasting
  fix(websocket): handle reconnection gracefully
  ```

* **middleware**: Express middleware (validation, authentication, error handling)
  ```
  feat(middleware): add request validation middleware
  improve(middleware): improve error handling
  ```

* **services**: Business logic services (user service, workspace service, etc.)
  ```
  feat(services): create workspace invitation service
  improve(services): extract notification logic
  ```

* **orm**: ORM/Prisma related changes (models, queries)
  ```
  feat(orm): define workspace-user relation
  improve(orm): optimize task queries
  ```

### **DevOps & Configuration Scopes:**

* **docker**: Docker and docker-compose configuration
  ```
  build(docker): add Redis container for sessions
  fix(docker): resolve PostgreSQL connection issue
  ```

* **deployment**: Deployment scripts and configuration
  ```
  ci(deployment): automate production deployment
  fix(deployment): correct HTTPS certificate setup
  ```

* **env**: Environment configuration and variables
  ```
  chore(env): add OAuth client ID to .env.example
  docs(env): document required environment variables
  ```

### **General Scopes:**

* **readme**: [README.md](README.md) changes
  ```
  docs(readme): add module implementation details
  docs(readme): update team roles section
  ```

* **deps**: Dependencies (when adding/updating packages)
  ```
  build(deps): upgrade React to 18.3.0
  build(deps): add zod for validation
  ```

* **config**: General configuration files (ESLint, Prettier, TypeScript, etc.)
  ```
  chore(config): add ESLint rules
  build(config): update TypeScript strict mode
  ```

### **No Scope (Optional):**
Use no scope for changes that affect the entire project:
```
improve: fix linting errors across all files
test: add test coverage reporting
chore: update .gitignore
```

---

## Body (Optional but Recommended for Complex Changes)

The body should:
* Explain the **motivation** for the change
* Contrast with **previous behavior** if applicable
* Provide **context** that doesn't fit in the subject

### When to use a body:
* Bug fixes that need explanation
* Features with complex implementation
* Refactors that change multiple files
* Performance improvements (show metrics)

### Example:
```
fix(websocket): prevent duplicate messages on reconnect

When a user loses connection and reconnects, the message
history was being re-sent and duplicated in the chat.

Fixed by tracking message IDs and filtering out duplicates
before displaying them to the user.
```

---

## Footer (Optional)

The footer contains:
* **Issue references** (Closes #123, Fixes #456, Refs #789)
* **Breaking changes** (BREAKING CHANGE: description)
* **Co-authors** (for pair programming)

### Issue References:

Link commits to GitHub issues:
```
Closes #42
Fixes #123, #456
Refs #789
```

### Breaking Changes:

If your change breaks existing functionality:
```
BREAKING CHANGE: workspace API now requires authentication

All workspace endpoints now require a valid JWT token.
Unauthenticated requests will receive 401 status.
```

Or use `!` in the header:
```
improve(api)!: change workspace member role structure
```

### Co-authors:

For pair programming or collaborative work:
```
Co-authored-by: Carmo Gama <cgama@student.42luanda.com>
Co-authored-by: José Bofengola <jbofengo@student.42luanda.com>
```

---

## Complete Examples

### Example 1: Simple Feature
```
feat(auth/ui): add password strength indicator
```

### Example 2: Bug Fix with Body
```
fix(auth/api): resolve token expiration edge case

Users were being logged out unexpectedly when their token
expired while they were actively using the app.

Now, the backend checks token expiration before each
request and refreshes it if needed.

Fixes #87
```

### Example 3: Feature with Breaking Change
```
feat(api)!: change task status enum values

BREAKING CHANGE: task status values changed from numeric
to string enums.

Before: status = 0 (todo), 1 (in-progress), 2 (done)
After: status = "todo", "in_progress", "done"

Frontend must update to use new string values.

Closes #52
```

### Example 4: Code Improvement with Co-author
```
improve(services): extract notification logic into service

Move notification creation logic from controllers into
a dedicated NotificationService. This improves testability
and separates concerns.

Co-authored-by: Dário Nzita <dnzita@student.42luanda.com>
```

### Example 5: Performance Improvement
```
improve(database): add composite index on workspace_members

Added composite index on (workspace_id, user_id) to speed
up member lookup queries.

Before: ~200ms per query
After: ~15ms per query

Refs #103
```

### Example 6: Documentation
```
docs(readme): add module selection justification

Explain why we chose each of the 14 modules and how they
contribute to the project goals.
```

---

## Quick Reference Card

```
Format: <type>(<scope>): <subject>

TYPES (what kind of change):
  feat     - new feature
  fix      - bug fix
  improve  - code quality (refactor/performance/style)
  test     - tests
  build    - dependencies/build
  ci       - CI/CD
  docs     - documentation
  chore    - maintenance
  revert   - undo commit

SCOPES (what part of project):
  Frontend: ui, auth/ui, profile, workspaces, kanban, chat, notifications, gamification
  Backend:  api, auth/api, database, websocket, middleware, services, orm
  DevOps:   docker, deployment, env
  General:  readme, deps, config

OPTIONAL:
  [body] - explain why and what changed
  [footer] - Closes #123, BREAKING CHANGE, Co-authored-by
```

---

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) - conventionalcommits\.org

- [Commit Message Guidelines](https://github.com/angular/angular/tree/22b96b96902e1a42ee8c5e807720424abad3082a?tab=contributing-ov-file#-commit-message-guidelines) - angular\.dev

---

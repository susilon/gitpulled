# AGENTS.md - AI Development Guidelines

## Project Overview

**AutoDeploy** is a lightweight webhook-based git automation service built with Node.js. It listens for webhook calls and automatically performs git pull + branch merge operations on configured local repositories.

## Core Features

1. **Webhook Endpoint** - Receives POST requests to trigger git operations
2. **Multi-Project Management** - Manages multiple git repositories via UI
3. **Authentication** - Login system with encrypted password storage
4. **Git Operations** - Automatic git pull and branch merge
5. **Docker Deployment** - Fully containerized with docker-compose

## Project Structure

```
autodeploy/
├── AGENTS.md                  # This file - AI guidelines
├── package.json               # Node.js dependencies
├── server.js                  # Main Express server
├── Dockerfile                 # Docker image definition
├── docker-compose.yml         # Docker Compose configuration
├── .env.example               # Environment variables template
├── data/
│   ├── accounts.json          # User accounts (encrypted passwords)
│   └── projects.json          # Project configurations
├── src/
│   ├── routes/
│   │   ├── auth.js            # Login/logout/session routes
│   │   ├── projects.js        # Project CRUD API routes
│   │   └── webhook.js         # Webhook trigger endpoint
│   ├── middleware/
│   │   └── auth.js            # Authentication middleware
│   ├── services/
│   │   └── git.js             # Git operations service
│   └── utils/
│       └── crypto.js          # Password encryption utilities
└── public/
    ├── index.html             # Login page
    ├── dashboard.html         # Project management dashboard
    ├── css/
    │   └── style.css          # Styles
    └── js/
        ├── login.js           # Login page logic
        └── dashboard.js       # Dashboard page logic
```

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Templating**: Static HTML + vanilla JS (no framework)
- **Auth**: express-session + crypto (password hashing)
- **Git**: simple-git (Node.js git wrapper)
- **Container**: Docker + Docker Compose

## Development Guidelines

### Code Style

- Use CommonJS modules (`require`/`module.exports`)
- Keep code simple and readable
- No TypeScript - plain JavaScript only
- Minimal dependencies - use built-in modules when possible

### File Conventions

- Server entry point: `server.js`
- Routes: `src/routes/<name>.js`
- Services: `src/services/<name>.js`
- Utilities: `src/utils/<name>.js`
- Static files: `public/`
- Data files: `data/`

### Security Requirements

- Passwords MUST be encrypted (scrypt/SHA-256 with salt)
- Session-based authentication with express-session
- Never store plaintext passwords
- Webhook endpoint should validate a shared secret token
- Use environment variables for sensitive config (session secret, webhook token)

### Git Operations

- Use `simple-git` library for git operations
- Default flow: `git pull origin <source-branch>` then `git checkout <target-branch>` and `git merge origin/<source-branch>`
- Handle errors gracefully (repo not found, merge conflicts, etc.)
- Log all git operations with timestamps

### Data Storage

- Use JSON files for simplicity (no database)
- `data/accounts.json` - array of `{ username, password, createdAt }`
- `data/projects.json` - array of `{ id, name, folderPath, sourceBranch, targetBranch, webhookToken, createdAt }`
- Create files on first run if they don't exist

### Docker

- Use `node:20-alpine` as base image
- Mount `data/` as volume for persistence
- Expose port 3000
- Environment variables: `SESSION_SECRET`, `PORT`

## API Endpoints

### Auth Routes (`/api/auth/`)

- `POST /api/auth/login` - Login (username, password)
- `POST /api/auth/logout` - Logout
- `GET /api/auth/status` - Check auth status

### Project Routes (`/api/projects/`) - Requires auth

- `GET /api/projects` - List all projects
- `POST /api/projects` - Add new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/trigger` - Manual trigger

### Webhook Route

- `POST /webhook/:token` - Trigger git operations for matching project

## Environment Variables

```env
PORT=3000
SESSION_SECRET=your-secret-key-here
WEBHOOK_DEFAULT_TOKEN=optional-default-token
```

## Commands

```bash
# Install dependencies
npm install

# Run development
node server.js

# Docker build and run
docker-compose up --build -d
```

## Merge Strategy

When webhook is triggered or manual trigger is used:

1. `git fetch origin` - Fetch latest from remote
2. `git checkout <target-branch>` - Switch to target branch
3. `git merge origin/<source-branch>` - Merge source into target
4. `git push origin <target-branch>` - Push merged result (optional, configurable)

## Error Handling

- All git operations wrapped in try-catch
- Return meaningful error messages in API responses
- Log errors with context for debugging
- Never expose internal errors to webhook callers (return generic message)

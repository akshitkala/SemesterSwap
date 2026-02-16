# Semester Swap Backend

## Phase 1: Infrastructure

This is the backend API for the Semester Swap application.

### Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)

### Structure
- `config/`: Configuration (DB connection, etc.)
- `controllers/`: Route logic
- `middleware/`: Custom middleware (Error handling, Auth)
- `models/`: Mongoose schemas
- `routes/`: API route definitions
- `app.js`: Express app setup
- `server.js`: Entry point and server startup

### Setup
1. `cd backend`
2. `npm install`
3. Create `.env` file (see `.env.example`)
4. `npm run dev`

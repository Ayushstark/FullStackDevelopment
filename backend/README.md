# OpportunityOS Backend

Modular, production-ready Express.js backend with resilient dual-mode data persistence (MongoDB with automatic local JSON fallback), JWT authentication, rate limiting, and integrations with competitive programming platforms (CodeChef, Codeforces, LeetCode, GeeksforGeeks, GitHub, Devpost).

## Architecture

```
backend/
├── src/
│   ├── app.js                 # Express application configuration & middleware
│   ├── server.js              # Server entry point & database connection
│   ├── config/
│   │   ├── db.js              # Resilient MongoDB connection & status
│   │   └── env.js             # Environment variable loader & defaults
│   ├── controllers/
│   │   ├── auth.controller.js     # Authentication (register, login, me, logout)
│   │   ├── contest.controller.js  # Live contest & event aggregation
│   │   ├── growth.controller.js   # Problem solving activity logs
│   │   ├── health.controller.js   # Service & database health status
│   │   ├── platform.controller.js # Multi-platform profile synchronization
│   │   └── user.controller.js     # Profile updates & handle configuration
│   ├── middleware/
│   │   ├── auth.js                # JWT verification middleware
│   │   ├── error.middleware.js    # Global error handler
│   │   └── rateLimiter.js         # Express rate limiters (auth & API)
│   ├── models/
│   │   ├── Application.js     # Opportunity application schema
│   │   ├── GrowthLog.js       # User activity log schema
│   │   ├── Opportunity.js     # Career opportunity schema
│   │   └── User.js            # User account & platform handles schema
│   ├── routes/
│   │   ├── auth.routes.js     # /api/auth/*
│   │   ├── contest.routes.js  # /api/contests
│   │   ├── growth.routes.js   # /api/growth/*
│   │   ├── health.routes.js   # /api/health
│   │   ├── index.js           # Central route aggregator
│   │   ├── platform.routes.js # /api/platforms/*
│   │   └── user.routes.js     # /api/user/*
│   ├── services/
│   │   ├── codechefService.js     # CodeChef scraper & parser
│   │   ├── codeforcesService.js   # Codeforces REST API integration
│   │   ├── contestService.js      # Multi-platform contest aggregator
│   │   ├── gfgService.js          # GeeksforGeeks practice parser
│   │   ├── githubService.js       # GitHub REST & contribution parser
│   │   └── leetcodeService.js     # LeetCode GraphQL API integration
│   ├── store/
│   │   └── fallbackStore.js       # Resilient local JSON storage engine
│   └── utils/
│       ├── ApiError.js        # Standard error model
│       ├── ApiResponse.js      # Standard response model
│       └── sanitize.js        # User data credential stripper
├── __tests__/                 # Vitest test suite
├── .env.example
├── local_db.example.json
└── package.json
```

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Run Development Server
```bash
npm run dev
# or start directly:
npm start
```

### 4. Run Tests
```bash
npm test
```

# Documentation

## Frontend

### Stack

- **Vite** — build tool and dev server
- **React 19** + **TypeScript**
- **React Router v7** — client-side routing

### Structure

```
frontend/
  src/
    api/
      client.ts     # fetch wrapper (GET, POST), reads VITE_API_URL
    pages/
      Home.tsx      # route: /
      About.tsx     # route: /about
    App.tsx         # route definitions
    main.tsx        # entry point
  .env              # environment variables
```

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Base URL of the FastAPI backend |

### Setup

```bash
cd frontend
npm install
```

### Run

```bash
npm run dev
```

Dev server runs at `http://localhost:5173`.

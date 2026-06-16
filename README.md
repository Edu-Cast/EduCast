# EduCast Frontend

**Modern educational platform frontend** built with **Next.js 14+**, **PostgreSQL**, and **Drizzle ORM**.

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Drizzle](https://img.shields.io/badge/Drizzle-000000?style=for-the-badge&logo=drizzle&logoColor=white)

## Features

- **Two operational modes**:
  - **Fast Local Mode** — full functionality without Spring backend (uses local PostgreSQL + Next.js API routes)
  - **Hybrid Mode** — seamless integration with Spring Boot backend + local fallback

- Ready for production and rapid local development
- Beautiful, responsive UI
- Full authentication flow (login/register)
- Audio courses, playlists, likes, comments support (ready to extend)

## Fast Start (Recommended)

### Requirements
- **Node.js** 20+
- **Docker** + **Docker Compose**

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL (port 5433)
docker compose up -d

# 3. Create environment file
cp .env.example .env

# 4. Apply database schema
npx drizzle-kit push

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Why it doesn't crash without `.env`

If `DATABASE_URL` is not set, the project automatically falls back to:

```env
postgresql://postgres:postgres@127.0.0.1:5433/app_db
```

This is specially configured for comfortable local development.

## Connect Spring Backend (Optional)

To enable hybrid mode with your Spring Boot backend:

1. Add to `.env`:

```env
SPRING_BACKEND_URL=http://localhost:8080
```

2. Frontend behavior:
   - `POST /api/auth/login` and `POST /api/auth/register` first try the Spring backend
   - If backend is unavailable — automatically falls back to local mode

## How to Replace Backend

You can gradually migrate to your own backend **without rewriting the UI**:

### Integration Points:
- Main config: `src/lib/spring-backend.ts`
- Auth routes:
  - `src/app/api/auth/login/route.ts`
  - `src/app/api/auth/register/route.ts`

### Migration Tips:
- Update URLs and data contracts in `spring-backend.ts`
- Remove fallback user creation in auth routes once backend is stable
- Move other endpoints (`/api/audios`, `/api/playlists`, likes, comments, etc.) the same way

## Useful Commands

```bash
# Start database
docker compose up -d

# Stop database
docker compose down

# Full database reset
docker compose down -v

# Type checking
npm exec tsc -- --noEmit

# Production build
npm run build

# Lint
npm run lint
```

## Project Structure Highlights

```
src/
├── app/ # Next.js App Router
├── lib/
│   ├── spring-backend.ts # Backend integration
│   └── db.ts# Drizzle client
├── components/  # Reusable UI components
└── ...
```

## Contributing

Feel free to open issues and pull requests!

## License

MIT License.

---

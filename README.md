# EduCast Frontend (Next.js + PostgreSQL + Drizzle)

Проект уже подготовлен для двух режимов:

1. **Быстрый локальный режим (без Spring backend)** — всё работает через локальную PostgreSQL + Next API.
2. **Гибридный режим (с Spring backend)** — `login/register` пытаются использовать Spring API, при недоступности backend используется локальный fallback.

---

## 1) Быстрый запуск (рекомендуется)

### Требования
- Node.js 20+
- Docker + Docker Compose

### Шаги
```bash
# 1. установить зависимости
npm install

# 2. поднять postgres на 5433
docker compose up -d

# 3. создать .env из шаблона
cp .env.example .env

# 4. применить схему drizzle
npx drizzle-kit push

# 5. запустить frontend
npm run dev
```

Открой: `http://localhost:3000`

---

## 2) Почему теперь не падает без .env

Если `DATABASE_URL` не задан, проект использует локальный fallback:

`postgresql://postgres:postgres@127.0.0.1:5433/app_db`

Это сделано специально для локальной разработки.

---

## 3) Подключение Spring backend (опционально)

Если у тебя есть backend на Spring Boot, добавь в `.env`:

```env
SPRING_BACKEND_URL=http://localhost:8080
```

Тогда `POST /api/auth/login` и `POST /api/auth/register` во frontend:
- сначала пытаются вызвать Spring backend,
- если backend недоступен — продолжают работать через локальный fallback.

---

## 4) Как потом заменить на свой backend

Ты сможешь заменить backend поэтапно без переписывания UI:

- Точка интеграции: `src/lib/spring-backend.ts`
- Auth прокси-роуты:  
  - `src/app/api/auth/login/route.ts`  
  - `src/app/api/auth/register/route.ts`

Что менять при замене:
1. Обновить URL/контракты в `spring-backend.ts`.
2. Убрать fallback-вставку пользователя в auth-роутах, когда backend станет полноценным.
3. По желанию перенести остальные роуты (`/api/audios`, `/api/playlists`, лайки, комментарии) на внешний backend аналогичным способом.

---

## 5) Полезные команды

```bash
# поднять БД
docker compose up -d

# остановить БД
docker compose down

# сбросить БД полностью
docker compose down -v

# проверка типов
npm exec tsc -- --noEmit

# production build
npm run build
```

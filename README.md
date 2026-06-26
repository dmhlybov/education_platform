# Education Platform

Корпоративная образовательная платформа с курсами, уроками и квизами. Студенты проходят материалы и сдают тесты; администраторы управляют контентом, пользователями и назначениями. Поддерживается вход через логин/пароль и SSO через Bitrix24.

---

## Стек технологий

### Backend
| Компонент | Версия |
|---|---|
| Python | 3.11+ |
| FastAPI | 0.115 |
| SQLAlchemy (async) | 2.0 |
| asyncpg | 0.31 |
| Alembic | 1.18 |
| fastapi-users | latest |
| PyJWT | 2.12 |
| passlib[bcrypt] | 1.7 |
| PostgreSQL | 14+ |

### Frontend
| Компонент | Версия |
|---|---|
| React | 19 |
| TypeScript | 5.8 |
| Vite | 6.4 |
| MUI (Material UI) | 7.0 |
| TanStack React Query | 5 |
| React Router | 7 |
| docx-preview | 0.3 |

---

## Архитектура

```
learning/
├── backend/
│   ├── main.py                  # Точка входа uvicorn
│   ├── config.py                # Загрузка .env, пути к папкам данных
│   ├── database.py              # Async SQLAlchemy engine + session
│   ├── core/
│   │   ├── app/
│   │   │   ├── app.py           # create_app() — фабрика приложения
│   │   │   ├── router.py        # Регистрация всех роутеров
│   │   │   ├── middleware.py    # CORS
│   │   │   ├── deps.py          # DI: current_active_user_ctx, current_superuser_ctx
│   │   │   └── startup.py       # Lifespan events
│   │   └── services/
│   │       └── user_config.py   # JWT strategy, fastapi-users instance
│   ├── models/
│   │   ├── auth.py              # User
│   │   └── learn.py             # Course, Theme, Lesson, Quiz, Question, AnswerOption, Attempt, CourseAssignment
│   ├── schemas/
│   │   ├── auth.py              # UserRead, UserCreate, UserUpdate, ...
│   │   └── learn.py             # CourseCreate/Read, QuizSubmission, ...
│   ├── modules/
│   │   ├── users.py             # /api/auth — авторизация, CRUD пользователей, Bitrix OAuth
│   │   ├── courses.py           # /api/courses — CRUD курсов, назначения
│   │   ├── quizzes.py           # /api/quizzes — отправка ответов, результаты
│   │   ├── uploads.py           # /api/uploads — загрузка файлов
│   │   └── health.py            # /health
│   ├── infrastructure/
│   │   └── bitrix.py            # Bitrix24 OAuth helpers
│   ├── data/
│   │   ├── uploads/             # Загруженные файлы (видео, аудио, документы)
│   │   └── scorm/               # SCORM-пакеты
│   └── migration/
│       ├── start_db.py          # Создание таблиц напрямую (альтернатива миграциям)
│       └── versions/            # Alembic-миграции
├── frontend/
│   └── src/
│       ├── main.tsx             # React Router, QueryClient, AuthProvider
│       ├── app/
│       │   └── AuthContext.tsx  # useAuth() — user, token, login(), logout()
│       ├── api/
│       │   ├── client.ts        # apiFetch() с Bearer-токеном
│       │   ├── auth.ts          # login, getMe, getStudents, createUser, linkBitrix
│       │   └── courses.ts       # getCourses, getCourseDetail, submitQuiz, uploadMedia, ...
│       ├── layout/
│       │   └── AppShell.tsx     # MUI Drawer sidebar + ShellHeader
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── DashboardPage.tsx
│       │   ├── CoursesPage.tsx
│       │   ├── CourseViewPage.tsx   # Просмотр урока + прохождение квиза
│       │   ├── ResultsPage.tsx
│       │   └── admin/
│       │       └── AdminPage.tsx    # Управление курсами, назначениями, пользователями
│       ├── components/
│       │   └── DocxViewer.tsx    # In-browser рендер .docx через docx-preview
│       ├── theme/
│       │   └── theme.ts          # MUI тема + CSS custom properties (dark/light)
│       └── types/
│           └── index.ts          # TypeScript-типы API
└── requirements.txt
```

---

## Локальная разработка

### Требования

- Python 3.11+
- Node.js 20+
- PostgreSQL 14+

### Backend

```bash
# 1. Создать и активировать виртуальное окружение
python -m venv venv
source venv/Scripts/activate   # Windows
# source venv/bin/activate      # Linux/Mac

# 2. Установить зависимости
pip install -r requirements.txt

# 3. Настроить переменные окружения (см. раздел ниже)

# 4. Применить миграции
alembic upgrade head
# или создать таблицы напрямую:
python migration/start_db.py

# 5. Запустить сервер (порт 8003)
uvicorn backend.main:app --host 0.0.0.0 --port 8003 --reload
```

### Frontend

```bash
cd frontend

# 1. Установить зависимости
npm install

# 2. Запустить dev-сервер (порт 5175, проксирует /api/* на :8003)
npm run dev

# 3. Production-сборка (TypeScript check + Vite build)
npm run build
```

---

## Переменные окружения

Конфиг находится в `backend/`. Файлы загружаются в порядке:
1. `backend/.env.common` — всегда
2. `backend/.env.local` — если `ENV != prod`
3. `backend/.env.prod` — если `ENV=prod`, перезаписывает `.env.common`

### `backend/.env.common`

```env
SECRET=your_jwt_secret_key

# Bitrix24 SSO (опционально)
BITRIX_PORTAL=https://your-portal.bitrix24.ru/
BITRIX_CLIENT_ID=your_client_id
BITRIX_CLIENT_SECRET=your_client_secret
BITRIX_REDIRECT_URI=https://your-domain.com/api/auth/bitrix/callback
BITRIX_FIRST_ADMIN_ID=your_id   # Bitrix ID пользователя, который получит права суперюзера

```

### `backend/.env.local`

```env
DB_USER=postgres
DB_PASS=your_password
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=learn
```

### `backend/.env.prod`

```env
DB_USER=postgres
DB_PASS=your_password
DB_HOST=        # пустой для unix-сокета /var/run/postgresql
DB_PORT=5432
DB_NAME=learn
```

Запуск в production-режиме:

```bash
ENV=prod uvicorn backend.main:app --host 0.0.0.0 --port 8003
```

---

## База данных

### Схема

**`User`** — пользователь системы.
- `id`, `email`, `hashed_password`, `first_name`, `second_name`
- `is_active`, `is_verified`, `is_admin`
- `bitrix_user_id` — привязка к аккаунту Bitrix24
- `last_login`

**`Course`** → **`Theme`** → **`Lesson`** + **`Quiz`**
- Курс содержит темы; каждая тема содержит уроки и один квиз
- Для обратной совместимости курс может иметь уроки/квиз без тем

**`Lesson`** — учебный материал; поле `content_type`: `text`, `video`, `audio`, `document`, `scorm`

**`Quiz`** → **`Question`** → **`AnswerOption`**
- У каждого варианта ответа есть флаг `is_correct`
- Поддерживается несколько правильных ответов; засчитывается только точное совпадение набора

**`Attempt`** → **`AttemptAnswer`** — история попыток прохождения квиза

**`CourseAssignment`** — связь пользователя с курсом

### Миграции

```bash
# Применить все миграции
alembic upgrade head

# Создать новую миграцию
alembic revision --autogenerate -m "описание"

# Откатить последнюю миграцию
alembic downgrade -1
```

Альтернатива для первого запуска (без истории миграций):

```bash
python migration/start_db.py
```

---

## API

Документация Swagger доступна по адресу: `http://localhost:8003/docs`

### Роуты

| Метод | Путь | Описание | Права |
|---|---|---|---|
| `GET` | `/health` | Healthcheck | — |
| `POST` | `/api/auth/login` | Вход (form-data: username, password) | — |
| `GET` | `/api/auth/user/me` | Текущий пользователь | auth |
| `GET` | `/api/auth/user/get_all` | Список всех пользователей | admin |
| `POST` | `/api/auth/user/register` | Создать пользователя | admin |
| `PATCH` | `/api/auth/user/edit/{id}` | Изменить имя/email | admin |
| `POST` | `/api/auth/user/switch_active/{id}` | Бан/разбан | admin |
| `POST` | `/api/auth/user/switch_superuser/{id}` | Выдать/забрать права admin | admin |
| `POST` | `/api/auth/user/change_password/{id}` | Сменить пароль | admin |
| `POST` | `/api/auth/user/admin_login/{id}` | Войти от имени пользователя | admin |
| `PATCH` | `/api/auth/user/link-bitrix/{id}` | Привязать/отвязать Bitrix ID | admin |
| `GET` | `/api/auth/bitrix/login` | Редирект на Bitrix OAuth | — |
| `GET` | `/api/auth/bitrix/callback` | OAuth callback | — |
| `GET` | `/api/courses` | Список курсов пользователя | auth |
| `POST` | `/api/courses` | Создать курс | admin |
| `GET` | `/api/courses/{id}` | Детали курса | auth |
| `PUT` | `/api/courses/{id}` | Обновить курс | admin |
| `DELETE` | `/api/courses/{id}` | Удалить курс | admin |
| `POST` | `/api/courses/{id}/assign` | Назначить курс пользователю | admin |
| `DELETE` | `/api/courses/{id}/unassign/{user_id}` | Снять назначение | admin |
| `GET` | `/api/courses/{id}/results` | Результаты прохождения | admin |
| `POST` | `/api/quizzes/{quiz_id}/submit` | Отправить ответы на квиз | auth |
| `POST` | `/api/uploads/document` | Загрузить файл | admin |
| `POST` | `/api/uploads/scorm` | Загрузить SCORM-пакет (ZIP) | admin |

### Аутентификация

Все защищённые роуты требуют заголовок:

```
Authorization: Bearer <jwt_token>
```

JWT выдаётся на **7 дней**.

---

## Типы контента уроков

| `content_type` | Описание | Хранение |
|---|---|---|
| `text` | HTML/Markdown-текст | В БД (поле `content`) |
| `video` | MP4-видео | `/uploads/<filename>` |
| `audio` | MP3/WAV-аудио | `/uploads/<filename>` |
| `document` | PDF, DOCX, PPTX, XLSX | `/uploads/<filename>` |
| `scorm` | SCORM 1.2/2004 пакет | `/scorm/<package>/index.html` |

Поле `content` для медиафайлов и документов содержит путь вида `/uploads/filename.ext`.

---

## Авторизация через Bitrix24

Платформа поддерживает SSO через корпоративный портал Bitrix24.

**Поток:**
1. Пользователь нажимает «Войти через Bitrix» → редирект на `GET /api/auth/bitrix/login`
2. Bitrix24 выполняет OAuth redirect на `GET /api/auth/bitrix/callback?code=...`
3. Сервер обменивает code на access_token, получает профиль пользователя
4. Если пользователь с таким `bitrix_user_id` существует — обновляет и логинит
5. Если найден по email — привязывает `bitrix_user_id` и логинит
6. Если не найден — создаёт нового пользователя автоматически
7. Возвращает JWT-токен

Пользователи с Bitrix ID из `BITRIX_FIRST_ADMIN_ID` автоматически получают права суперюзера.

Привязка/отвязка Bitrix ID к существующему пользователю доступна администратору в разделе «Пользователи» в AdminPage. Один Bitrix ID не может быть привязан к двум пользователям одновременно.

---

## Статические файлы

```
/uploads/<filename>   →  backend/data/uploads/
/scorm/<package>/     →  backend/data/scorm/
```

Папки создаются автоматически при старте приложения.

---

## Деплой

Приложение развёрнуто на `https://learning.smmwall.org`. Nginx проксирует запросы:
- `/api/*`, `/uploads/*`, `/scorm/*` → FastAPI на порту 8003
- `/*` → собранный фронтенд из `frontend/dist/`

**Сборка фронтенда:**

```bash
cd frontend
npm run build
# Артефакты в frontend/dist/
```

**Запуск backend:**

```bash
ENV=prod uvicorn backend.main:app --host 0.0.0.0 --port 8003 --workers 4
```

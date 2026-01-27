# 🚀 SMAE API

> Backend API REST para el Sistema de Maestría y Aprendizaje Efectivo

## 📋 Stack

| Tecnología | Propósito |
|------------|-----------|
| Express.js | Framework HTTP |
| PostgreSQL | Base de datos |
| Prisma | ORM |
| TypeScript | Type Safety |

---

## 🛠 Configuración

### 1. Variables de Entorno

Crear/editar `.env`:

```env
DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/smae_db"
PORT=3001
```

### 2. Crear Base de Datos

En pgAdmin o terminal:

```sql
CREATE DATABASE smae_db;
```

### 3. Instalar Dependencias

```bash
npm install
```

### 4. Generar Prisma Client y Migrar BD

```bash
npm run db:generate
npm run db:push
```

### 5. Ejecutar en Desarrollo

```bash
npm run dev
```

El API estará en: `http://localhost:3001`

---

## 📚 Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/skills` | Listar skills |
| GET | `/api/skills/:id` | Obtener skill |
| POST | `/api/skills` | Crear skill |
| PUT | `/api/skills/:id` | Actualizar skill |
| DELETE | `/api/skills/:id` | Eliminar skill |
| PUT | `/api/skills/:id/level-up` | Subir nivel |

---

## 📜 Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Desarrollo con hot-reload |
| `npm run build` | Compilar TypeScript |
| `npm start` | Ejecutar build |
| `npm run db:generate` | Generar Prisma Client |
| `npm run db:push` | Sincronizar esquema a BD |
| `npm run db:studio` | UI visual de Prisma |

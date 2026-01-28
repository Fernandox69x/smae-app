# 🗺️ Guía de Arquitectura S.M.A.E.

Este proyecto está dividido en dos grandes bloques: **Backend** (API y Base de Datos) y **Frontend** (Interfaz de Usuario).

---

## 📂 Visión General del Proyecto

```text
smae-app/
├── 📁 backend/             # 🟢 API REST (Express + Prisma + PostgreSQL)
├── 📁 src/                 # 🔵 Frontend (React + TypeScript + Vite)
├── 📁 docs/                 # 📂 Documentación y Changelog
└── 📄 README.md            # 📑 Documentación principal
```

---

## 🟢 Backend (`/backend`)
Gestiona los datos de forma persistente y segura.

- **`prisma/schema.prisma`**: El "mapa" de la base de datos. Define usuarios y skills.
- **`src/index.ts`**: Punto de entrada. Configura el servidor Express y middlewares.
- **`src/routes/`**:
    - `auth.ts`: Lógica de registro y login (JWT).
    - `skills.ts`: CRUD de habilidades filtradas por usuario.
- **`src/middleware/auth.ts`**: Protege las rutas verificando el token del usuario.

---

## 🔵 Frontend (`/src`)
Sigue los principios de **Arquitectura Limpia** para separar la lógica de la interfaz.

### 1. `domain/` (El Corazón)
Contiene las reglas de negocio puras. No depende de nada externo.
- **`entities/Skill.ts`**: Clase que sabe si una skill puede subir de nivel o si está en cooldown.
- **`types/`**: Definición de interfaces y tipos TypeScript.
- **`constants/`**: Configuración de niveles S.M.A.E.

### 2. `application/` (Casos de Uso)
Orquestra la lógica de dominio.
- **`services/LayoutService.ts`**: El cerebro que calcula dónde posicionar cada nodo automáticamente.
- **`services/SkillService.ts`**: Lógica de validación de level-up.

### 3. `infrastructure/` (Datos Externos)
Cómo nos comunicamos con el mundo exterior.
- **`repositories/ApiSkillRepository.ts`**: Implementa las llamadas `fetch` al backend, enviando el token JWT.

### 4. `presentation/` (Lo que ves)
Interfaz de usuario y estado visual.
- **`components/`**: Botones, modales y el grafo (`SkillGraph`).
- **`context/`**: 
    - `AuthContext.tsx`: Gestiona si el usuario está logueado.
    - `SkillContext.tsx`: Gestiona la lista de habilidades y las acciones del usuario.
- **`hooks/`**: Funciones reutilizables para que los componentes accedan fácilmente a los datos.
- **`pages/`**: Páginas completas (AuthPage).

---

## ⚙️ Flujo de Datos
1.  El usuario hace clic en "Subir Nivel".
2.  El **Componente** llama al **Hook**.
3.  El **Hook** llama al **Contexto**.
4.  El **Contexto** usa el **Repositorio** para avisar al **Backend**.
5.  El **Backend** valida, guarda en **PostgreSQL** y responde.
6.  El **Contexto** actualiza las skills y el **Grafo** se redibuja solo.

---

## 🚀 Comandos Útiles

```bash
# Frontend
npm run dev          # Iniciar en desarrollo
npm run build        # Build de producción

# Backend
cd backend
npm run dev          # Iniciar servidor
npm run db:push      # Sincronizar schema a BD
npm run db:generate  # Generar Prisma Client
```

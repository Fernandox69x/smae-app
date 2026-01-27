# Changelog

Todas las cambios notables del proyecto serán documentados aquí.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/).

---

## [2.0.0] - 2026-01-26

### ✨ Added
- **Backend API** con Express.js y PostgreSQL
- ORM **Prisma** para gestión de base de datos
- Endpoints REST completos (CRUD + level-up)
- **ApiSkillRepository** para consumir API desde frontend
- Modal **SkillFormModal** para crear/editar skills
- Botones de **editar** y **eliminar** en sidebar
- Botón **Nueva Skill** en header
- Estados de **loading** y **error** en UI

### 🔄 Changed
- Migrado de `LocalSkillRepository` a `ApiSkillRepository`
- Context actualizado para operaciones async
- Hooks con soporte para CRUD

### 🏗 Architecture
- Backend separado en `/backend`
- API REST en puerto 3001
- Frontend consume API via fetch

---

## [1.0.0] - 2026-01-26

### ✨ Added
- Estructura de proyecto usando **Arquitectura Limpia**
- Migración completa a **TypeScript**
- Capa de **Domain**: entidades, tipos, interfaces
- Capa de **Application**: casos de uso, servicios
- Capa de **Infrastructure**: repositorio local
- Capa de **Presentation**: componentes React
- Path aliases configurados (`@domain`, `@application`, etc.)
- Documentación completa: README, architecture.md, business-logic.md

### 🔄 Changed
- Refactorizado monolito `App.jsx` (467 líneas) a arquitectura modular
- Convertido de JavaScript a TypeScript
- Lógica de negocio encapsulada en entidad `Skill`

### 🏗 Architecture
- Implementados principios **SOLID**
- Separación de responsabilidades por capas
- Inversión de dependencias con `ISkillRepository`

---

## [0.0.1] - 2026-01-25

### ✨ Added
- Versión inicial del proyecto
- Prototipo monolítico en `App.jsx`

# 🎯 Proyecto S.M.A.E.

> **Sistema de Maestría y Aprendizaje Efectivo**

Aplicación para gestionar el progreso de aprendizaje de habilidades siguiendo la metodología S.M.A.E., un sistema de 5 niveles basado en neurociencia cognitiva.

![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?logo=tailwindcss)

## 📋 Tabla de Contenidos

- [Stack Tecnológico](#-stack-tecnológico)
- [Instalación](#-instalación)
- [Arquitectura](#-arquitectura)
- [Lógica de Negocio](#-lógica-de-negocio)
- [Estructura de Carpetas](#-estructura-de-carpetas)
- [Scripts Disponibles](#-scripts-disponibles)

## 🛠 Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 19.x | Librería UI |
| TypeScript | 5.x | Type Safety |
| Vite | 7.x | Build Tool |
| TailwindCSS | 3.x | Estilos |
| Lucide React | - | Iconografía |
| **Express** | 5.x | Backend API |
| **PostgreSQL** | - | Base de datos |
| **Prisma** | 7.x | ORM |

## 🚀 Instalación

### Prerrequisitos

- Node.js >= 18.x
- npm >= 9.x

### Pasos

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd smae-app

# 2. Instalar dependencias
npm install

# 3. Ejecutar en modo desarrollo
npm run dev

# 4. Abrir en el navegador
# http://localhost:5173
```

### Build de Producción

```bash
npm run build
npm run preview
```

## 🏗 Arquitectura

El proyecto sigue **Arquitectura Limpia** con principios **SOLID**:

```
┌─────────────────────────────────────────────────────────────┐
│                    🔴 PRESENTATION                          │
│  (React Components, Hooks, Context)                         │
├─────────────────────────────────────────────────────────────┤
│                    🟢 APPLICATION                           │
│  (Use Cases, Services)                                      │
├─────────────────────────────────────────────────────────────┤
│                    🟡 INFRASTRUCTURE                        │
│  (Repositories, External APIs)                              │
├─────────────────────────────────────────────────────────────┤
│                    🔵 DOMAIN                                │
│  (Entities, Types, Interfaces, Constants)                   │
└─────────────────────────────────────────────────────────────┘
```

### Principios SOLID Aplicados

| Principio | Implementación |
|-----------|----------------|
| **S**ingle Responsibility | Cada archivo = una responsabilidad |
| **O**pen/Closed | Extensible sin modificar código existente |
| **L**iskov Substitution | `ISkillRepository` intercambiable |
| **I**nterface Segregation | Interfaces pequeñas y específicas |
| **D**ependency Inversion | Capas superiores dependen de abstracciones |

## 🧠 Lógica de Negocio

### Metodología S.M.A.E.

Sistema de 5 niveles para el dominio de habilidades:

| Nivel | Nombre | Descripción |
|-------|--------|-------------|
| **L0** | Inactivo | Habilidad no iniciada |
| **L1** | Exposición | Entiendes la teoría |
| **L2** | Copia | Ejecución con guía |
| **L3** | Autonomía | Ejecución sin ayuda (prueba en frío) |
| **L4** | Consolidación | Repetición tras 48h (memoria largo plazo) |
| **L5** | Maestría | Integración en flujo real o enseñanza |

### Reglas del Sistema

1. **WIP (Work In Progress)**: Máximo 3 habilidades activas simultáneamente
2. **Dependencias**: Los padres deben estar en L4+ para desbloquear hijos
3. **Cooldown 48h**: Para pasar de L3 → L4, esperar 48 horas (consolidación de memoria)
4. **Evidencia Obligatoria**: Cada avance de nivel requiere registro tangible

## 📁 Estructura de Carpetas

```
src/
├── domain/                 # 🔵 Capa de Dominio
│   ├── entities/           # Entidades de negocio
│   ├── constants/          # Constantes (LEVELS, MAX_WIP)
│   ├── types/              # Tipos TypeScript
│   └── interfaces/         # Contratos (ISkillRepository)
│
├── application/            # 🟢 Capa de Aplicación
│   ├── useCases/           # Casos de uso (levelUp, checkCooldown)
│   └── services/           # Servicios (SkillService)
│
├── infrastructure/         # 🟡 Capa de Infraestructura
│   └── repositories/       # Implementaciones de repositorios
│
├── presentation/           # 🔴 Capa de Presentación
│   ├── components/         # Componentes React
│   ├── hooks/              # Hooks personalizados
│   └── context/            # Contextos React
│
├── App.tsx                 # Componente raíz
├── main.tsx                # Punto de entrada
└── index.css               # Estilos globales
```

## 📜 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia servidor de desarrollo |
| `npm run build` | Compila para producción |
| `npm run preview` | Preview del build de producción |
| `npm run lint` | Ejecuta ESLint |

## 📚 Documentación Adicional

- [Arquitectura del Sistema](./docs/architecture.md)
- [Lógica de Negocio Detallada](./docs/business-logic.md)
- [Changelog](./docs/changelog.md)

---

<p align="center">
  Desarrollado con 💚 siguiendo principios de <strong>Arquitectura Limpia</strong> y <strong>SOLID</strong>
</p>

# Arquitectura del Sistema S.M.A.E.

## Visión General

El proyecto implementa **Arquitectura Limpia** (Clean Architecture) para separar responsabilidades y facilitar el mantenimiento y testing.

## Capas

### 🔵 Domain (Dominio)

La capa más interna. Contiene la lógica de negocio pura, sin dependencias externas.

**Contenido:**
- `entities/Skill.ts` - Entidad principal con métodos de negocio
- `constants/levels.tsx` - Configuración de niveles S.M.A.E.
- `types/index.ts` - Tipos e interfaces TypeScript
- `interfaces/ISkillRepository.ts` - Contrato del repositorio

**Principio:** No depende de ninguna otra capa.

### 🟢 Application (Aplicación)

Orquesta los casos de uso y coordina la lógica entre capas.

**Contenido:**
- `useCases/levelUp.ts` - Lógica de subida de nivel
- `useCases/validateRequirements.ts` - Validación de dependencias
- `useCases/checkCooldown.ts` - Verificación de período de espera
- `services/SkillService.ts` - Servicio principal

**Principio:** Depende solo de Domain.

### 🟡 Infrastructure (Infraestructura)

Implementaciones concretas de interfaces definidas en Domain.

**Contenido:**
- `repositories/LocalSkillRepository.ts` - Repositorio en memoria

**Principio:** Implementa interfaces de Domain.

### 🔴 Presentation (Presentación)

Capa de UI con componentes React.

**Contenido:**
- `components/` - Componentes visuales
- `hooks/` - Hooks personalizados
- `context/` - Estado global React

**Principio:** Consume servicios de Application.

## Flujo de Datos

```
Usuario → Presentation → Application → Domain
                ↓
         Infrastructure
```

## Path Aliases

Configurados en `tsconfig.json` y `vite.config.ts`:

```typescript
@domain/*        → src/domain/*
@application/*   → src/application/*
@infrastructure/* → src/infrastructure/*
@presentation/*  → src/presentation/*
```

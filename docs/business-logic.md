# Lógica de Negocio S.M.A.E.

## ¿Qué es S.M.A.E.?

**S**istema de **M**aestría y **A**prendizaje **E**fectivo

Metodología basada en neurociencia cognitiva para el dominio progresivo de habilidades.

---

## Escala de Niveles

### L0: Inactivo
- Habilidad identificada pero no iniciada
- Icono: 🔒

### L1: Exposición
- Entiendes la teoría
- Sabes "qué es" y "para qué sirve"
- Icono: 📖

### L2: Copia
- Puedes ejecutar con instrucciones/guía
- Necesitas referencia o asistencia
- Icono: 📋

### L3: Autonomía
- **Prueba en frío**: ejecución sin ayuda
- Primera demostración de competencia real
- Icono: 🧠

### L4: Consolidación
- Repetición exitosa después de 48+ horas
- Memoria a largo plazo formada
- Icono: ⏰

### L5: Maestría
- Integración en flujos reales
- Capaz de enseñar a otros
- Icono: 👑

---

## Reglas del Sistema

### 1. Límite WIP (Work In Progress)

```
Máximo: 3 habilidades activas simultáneamente
```

**Fundamento:** La carga cognitiva óptima evita la dispersión del aprendizaje.

### 2. Gestión de Dependencias

```
Las habilidades padre deben estar en L4+ para desbloquear hijas
```

**Ejemplo:**
- Para aprender "Acordes Abiertos", primero "Afinación Standard" debe estar en L4+

### 3. Cooldown de 48 Horas (L3 → L4)

```
Esperar 48 horas entre L3 y L4
```

**Fundamento:** El cerebro consolida información durante el sueño y descanso. Este período es crítico para formar memorias a largo plazo.

### 4. Evidencia Obligatoria

```
Cada avance de nivel requiere registro tangible
```

**Tipos de evidencia:**
- Video de práctica
- Audio de ejecución
- Imagen/captura
- Notas escritas

---

## Visualización DAG (Grafo Dirigido Acíclico)

Las habilidades se representan como nodos en un grafo donde:

- **Líneas verdes sólidas**: Dependencia satisfecha (padre en L4+)
- **Líneas rojas discontinuas**: Dependencia no satisfecha
- **Punto rojo en línea**: Bloqueo activo

---

## Colores de Nodos

| Estado | Color |
|--------|-------|
| Bloqueado (L0) | Gris oscuro |
| Desbloqueado (L0) | Gris claro |
| En progreso (L1-L4) | Verde esmeralda |
| Maestría (L5) | Dorado con glow |

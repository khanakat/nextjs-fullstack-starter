# Optimización de Imports - Análisis y Plan

## Problemas Identificados

### 1. Duplicación de Clientes de Base de Datos

- **@/lib/db** y **@/lib/prisma** exportan el mismo PrismaClient
- Ambos archivos son idénticos pero con nombres diferentes (`db` vs `prisma`)
- Esto causa confusión y duplicación innecesaria

### 2. Imports Inconsistentes

- Algunos archivos usan `import { db } from '@/lib/db'`
- Otros usan `import { prisma } from '@/lib/prisma'`
- Algunos incluso usan alias: `import { db as prisma } from '@/lib/db'`

### 3. Utilidades Fragmentadas

- Múltiples imports de `@/lib/utils` para funciones específicas
- Oportunidad de crear barrel exports para mejor organización

## Plan de Optimización

### Fase 1: Consolidar Cliente de Base de Datos

1. Mantener solo `/lib/db.ts` como fuente única
2. Crear re-export en `/lib/prisma.ts` para compatibilidad
3. Migrar gradualmente todos los imports a usar `@/lib/db`

### Fase 2: Optimizar Imports de Utilidades

1. Crear barrel exports en `/lib/index.ts`
2. Agrupar imports relacionados
3. Reducir número de imports individuales

### Fase 3: Consolidar Servicios

1. Crear barrel exports para servicios
2. Optimizar imports de servicios relacionados
3. Mejorar tree-shaking

## Archivos Afectados

### Base de Datos (57 archivos con @/lib/db, 37 archivos con @/lib/prisma)

- Necesitan migración a import unificado

### Utilidades (140+ archivos con @/lib/utils)

- Candidatos para barrel exports

### Servicios (60+ archivos con @/lib/services)

- Oportunidad de optimización con barrel exports

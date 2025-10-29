# Guía de Optimización de Performance

Esta guía documenta las optimizaciones de performance implementadas en el proyecto y cómo utilizarlas efectivamente.

## 📊 Resumen de Optimizaciones

### ✅ Implementadas en Phase 4

1. **Lazy Loading de Componentes**
2. **Optimización de Bundle Splitting**
3. **Sistema de Monitoreo de Performance**
4. **Consolidación de Utilidades**
5. **Optimización de Imports**
6. **Sistema de Testing Básico**

## 🚀 Lazy Loading

### Componentes Lazy Implementados

El sistema de lazy loading está centralizado en `lib/performance/lazy-components.tsx`:

```typescript
// Componentes principales con lazy loading
export const LazyAnalyticsDashboard = lazy(
  () => import("@/components/analytics/analytics-dashboard"),
);

export const LazyReportsDashboard = lazy(
  () => import("@/components/reports/reports-dashboard"),
);

export const LazyWorkflowsDashboard = lazy(
  () => import("@/components/workflows/workflows-dashboard"),
);
```

### Uso de Lazy Loading

```typescript
import { LazyAnalyticsDashboard } from '@/lib/performance/lazy-components';
import { Suspense } from 'react';

function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <LazyAnalyticsDashboard />
    </Suspense>
  );
}
```

### Componentes de UI con Lazy Loading

Utiliza `components/ui/lazy-loading.tsx` para casos específicos:

```typescript
import { LazyLoad, LazyImage, ProgressiveList } from '@/components/ui/lazy-loading';

// Carga basada en viewport
<LazyLoad fallback={<Skeleton />}>
  <HeavyComponent />
</LazyLoad>

// Imágenes lazy
<LazyImage
  src="/heavy-image.jpg"
  alt="Description"
  placeholder="/placeholder.jpg"
/>

// Listas progresivas
<ProgressiveList
  items={largeDataSet}
  renderItem={(item) => <ItemComponent item={item} />}
  batchSize={20}
/>
```

## 📦 Bundle Optimization

### Configuración en next.config.js

```javascript
// Bundle splitting optimizado
webpack: (config, { dev, isServer }) => {
  if (!dev && !isServer) {
    config.optimization.splitChunks = {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all",
          priority: 10,
        },
        charts: {
          test: /[\\/]node_modules[\\/](recharts|d3|chart\.js)[\\/]/,
          name: "charts",
          chunks: "all",
          priority: 20,
        },
        ui: {
          test: /[\\/]node_modules[\\/](@radix-ui|@headlessui)[\\/]/,
          name: "ui",
          chunks: "all",
          priority: 15,
        },
      },
    };
  }
  return config;
};
```

### Análisis de Bundle

```bash
# Analizar el bundle
npm run analyze

# Esto generará un reporte en .next/analyze/
```

## 📈 Sistema de Monitoreo

### Performance Monitor

El sistema de monitoreo está en `lib/monitoring/performance-monitor.ts`:

```typescript
import { usePerformanceMonitor } from '@/lib/monitoring/performance-monitor';

function MyComponent() {
  const { getPerformanceScore, getMetrics, getAlerts } = usePerformanceMonitor();

  const score = getPerformanceScore();
  const alerts = getCriticalAlerts();

  return (
    <div>
      <p>Performance Score: {score}</p>
      {alerts.length > 0 && (
        <div className="alerts">
          {alerts.map(alert => (
            <div key={alert.timestamp}>{alert.message}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Métricas Monitoreadas

- **Core Web Vitals**: LCP, FID, CLS
- **Timing Metrics**: TTFB, FCP, Load Complete
- **Resource Loading**: Tiempo de carga de recursos
- **Memory Usage**: Uso de memoria JavaScript
- **Layout Shifts**: Cambios de layout inesperados

### Health Checks

Endpoint disponible en `/api/monitoring/health`:

```typescript
// GET /api/monitoring/health
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "services": {
    "database": {
      "status": "connected",
      "responseTime": 25
    }
  },
  "metrics": {
    "memory": {
      "used": 50000000,
      "total": 100000000,
      "percentage": 50
    }
  }
}
```

## 🛠 Utilidades Consolidadas

### Type Helpers

Todas las utilidades de tipos están en `lib/utils/type-helpers.ts`:

```typescript
import {
  debounce,
  throttle,
  isString,
  isNumber,
  deepEqual,
  formatBytes,
} from "@/lib/utils/type-helpers";

// Uso de debounce consolidado
const debouncedSearch = debounce((query: string) => {
  // Lógica de búsqueda
}, 300);

// Validaciones de tipo
if (isString(value)) {
  // TypeScript sabe que value es string
}

// Comparación profunda
if (deepEqual(obj1, obj2)) {
  // Objetos son iguales
}
```

### Hooks Consolidados

Los hooks comunes están en `hooks/use-common.ts`:

```typescript
import { useDebounce, useThrottle } from "@/hooks/use-common";

function SearchComponent() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery);
    }
  }, [debouncedQuery]);
}
```

## 🧪 Sistema de Testing

### Configuración Jest

```javascript
// jest.config.js
module.exports = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverageFrom: [
    "lib/**/*.{js,jsx,ts,tsx}",
    "components/**/*.{js,jsx,ts,tsx}",
    "app/**/*.{js,jsx,ts,tsx}",
  ],
};
```

### Ejecutar Tests

```bash
# Ejecutar todos los tests
npm test

# Tests en modo watch
npm run test:watch

# Tests con coverage
npm run test:coverage
```

### Tests Implementados

1. **Type Helpers**: `__tests__/utils/type-helpers.test.ts`
2. **Security Middleware**: `__tests__/security/security-middleware.test.ts`
3. **API Health**: `__tests__/api/health.test.ts`

## 📊 Métricas de Performance

### Objetivos Alcanzados

- ✅ **Bundle Size**: Reducido mediante code splitting
- ✅ **Lazy Loading**: Implementado para componentes pesados
- ✅ **Import Optimization**: Eliminados imports duplicados
- ✅ **Utility Consolidation**: Funciones duplicadas consolidadas
- ✅ **Monitoring**: Sistema de monitoreo en tiempo real
- ✅ **Testing**: Framework de testing básico

### Métricas Objetivo

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **TTFB (Time to First Byte)**: < 800ms
- **Bundle Size**: Reducción del 20-30%

## 🔧 Herramientas de Desarrollo

### Scripts Disponibles

```bash
# Optimizar imports automáticamente
node scripts/optimize-imports.js

# Analizar bundle
npm run analyze

# Verificar performance
npm run build && npm start
```

### Debugging Performance

1. **Chrome DevTools**: Performance tab
2. **Lighthouse**: Auditorías automáticas
3. **Bundle Analyzer**: Análisis de tamaño
4. **Performance Monitor**: Métricas en tiempo real

## 📝 Mejores Prácticas

### 1. Lazy Loading

- Usa lazy loading para componentes > 50KB
- Implementa skeletons apropiados
- Considera el viewport para carga automática

### 2. Bundle Optimization

- Separa vendors de código de aplicación
- Agrupa librerías similares (UI, charts, etc.)
- Usa dynamic imports para rutas

### 3. Monitoring

- Monitorea Core Web Vitals continuamente
- Configura alertas para métricas críticas
- Revisa performance regularmente

### 4. Testing

- Testa funcionalidades críticas
- Incluye tests de performance
- Mantén coverage > 50%

## 🚨 Alertas y Troubleshooting

### Alertas Comunes

1. **High Memory Usage**: > 80% de heap
2. **Slow LCP**: > 4s
3. **High CLS**: > 0.25
4. **Slow Resources**: > 5s de carga

### Soluciones

1. **Memory Leaks**: Revisar event listeners y timers
2. **Slow Loading**: Implementar más lazy loading
3. **Layout Shifts**: Reservar espacio para contenido dinámico
4. **Bundle Size**: Analizar y optimizar dependencias

## 📈 Próximos Pasos

### Optimizaciones Futuras

1. **Service Workers**: Para caching avanzado
2. **Image Optimization**: WebP y lazy loading
3. **Database Optimization**: Query optimization
4. **CDN Integration**: Para assets estáticos
5. **Edge Computing**: Para mejor latencia

### Monitoreo Avanzado

1. **Real User Monitoring (RUM)**
2. **Error Tracking Integration**
3. **Performance Budgets**
4. **Automated Performance Testing**

---

Esta guía se actualiza continuamente conforme se implementan nuevas optimizaciones. Para más información, consulta la documentación específica de cada componente.

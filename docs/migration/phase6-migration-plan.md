# Phase 6: Migration & Testing - Detailed Plan

## Overview

This document outlines the detailed plan for migrating legacy code to Clean Architecture and establishing comprehensive testing practices.

## Current State Analysis

### Legacy Code Distribution

**Total Legacy Files Identified:** 60+ files
- P0 (Critical): 45+ API routes with direct database access
- P1 (High): 12+ service files with mixed concerns
- P2 (Medium): 15+ utility files needing reorganization
- P3 (Low): Various components and hooks

### Key Issues Found

1. **Direct Database Access** - Prisma calls in presentation layer
2. **Missing Repository Pattern** - No abstraction for data access
3. **Business Logic in Controllers** - Violation of clean architecture
4. **Mixed Concerns** - Domain, infrastructure, and application logic intertwined
5. **No Dependency Injection** - Tight coupling to implementations

## Migration Strategy

### Migration Phases

#### Phase 6.1: Critical API Routes (Weeks 1-3)
**Goal:** Migrate high-traffic API routes to clean architecture

**Files to Migrate:**
1. `app/api/reports/route.ts` - Reports API with business logic
2. `app/api/collaboration/comments.ts` - Comments/collaboration API
3. `app/api/users/route.ts` - User management (partial, needs cleanup)
4. `app/api/analytics/route.ts` - Analytics endpoints
5. `app/api/workflows/route.ts` - Workflow management

**Process:**
1. Create domain entities and value objects
2. Define repository interfaces
3. Implement application use cases
4. Create infrastructure repositories
5. Build presentation controllers
6. Route to new implementation
7. Add tests
8. Remove old code

**Success Criteria:**
- ✅ No direct Prisma calls in migrated routes
- ✅ Complete layer separation
- ✅ All business logic in domain/application layers
- ✅ Test coverage > 80%

#### Phase 6.2: Service Layer Migration (Weeks 4-6)
**Goal:** Migrate root-level services to slice architecture

**Files to Migrate:**
1. `api/services/IntegrationService.ts` - Third-party integrations
2. `lib/services/analytics-service.ts` - Analytics processing
3. `lib/services/audit.ts` - Audit logging
4. `lib/services/email-service.ts` - Email notifications
5. `lib/services/file-storage-service.ts` - File management
6. `lib/services/export-service.ts` - Data export functionality

**Process:**
1. Extract domain logic from services
2. Create domain services where needed
3. Move infrastructure concerns to infrastructure layer
4. Create application use cases
5. Implement proper DI
6. Add comprehensive tests

**Success Criteria:**
- ✅ All services follow clean architecture
- ✅ Proper dependency injection
- ✅ Infrastructure isolated from domain
- ✅ Test coverage > 80%

#### Phase 6.3: Utility & Helper Migration (Weeks 7-8)
**Goal:** Organize utility functions by layer

**Files to Migrate:**
1. `lib/api-utils.ts` → Presentation layer
2. `lib/auth-helpers.ts` → Infrastructure/Domain (split)
3. `lib/error-utils.ts` → Shared layer
4. `lib/export-utils.ts` → Application/Domain (split)
5. `lib/cache/cache-service.ts` → Infrastructure layer

**Process:**
1. Analyze each utility function's responsibility
2. Move to appropriate layer
3. Create proper abstractions
4. Update imports across codebase
5. Add tests

**Success Criteria:**
- ✅ Clear layer separation
- ✅ No circular dependencies
- ✅ All utilities tested
- ✅ Documentation updated

#### Phase 6.4: Testing & Quality (Weeks 9-10)
**Goal:** Comprehensive testing suite

**Testing Strategy:**
1. **Unit Tests** - Test domain logic in isolation
2. **Integration Tests** - Test application use cases
3. **API Tests** - Test presentation layer endpoints
4. **E2E Tests** - Test critical user flows

**Coverage Targets:**
- Domain layer: 90%+
- Application layer: 85%+
- Infrastructure layer: 75%+
- Presentation layer: 70%+

**Test Infrastructure:**
1. Set up test database (PostgreSQL)
2. Mock external services
3. Create test fixtures
4. Establish test CI/CD

#### Phase 6.5: Performance & Optimization (Week 11)
**Goal:** Optimize performance and remove bottlenecks

**Areas to Optimize:**
1. Database queries - Add indexes, optimize N+1 queries
2. Caching strategy - Implement caching for frequently accessed data
3. API responses - Optimize payload sizes
4. Background jobs - Optimize job processing

**Metrics to Track:**
- API response times (p50, p95, p99)
- Database query performance
- Memory usage
- CPU utilization

#### Phase 6.6: Documentation & Cleanup (Week 12)
**Goal:** Complete documentation and remove legacy code

**Deliverables:**
1. Update all documentation
2. Create architecture decision records (ADRs)
3. Remove all legacy code
4. Final code review
5. Deployment guide

## Priority Order

### P0 - Critical (Do First)
1. **API Routes with Direct DB Access**
   - Impact: Blocks clean architecture adoption
   - Risk: High - Breaking changes possible
   - Effort: 3 weeks

### P1 - High (Do Second)
2. **Service Classes**
   - Impact: Core business logic
   - Risk: Medium - Well-defined slices exist
   - Effort: 3 weeks

### P2 - Medium (Do Third)
3. **Utility Functions**
   - Impact: Code organization
   - Risk: Low - Mostly moves
   - Effort: 2 weeks

### P3 - Low (Do Last)
4. **Component Cleanup**
   - Impact: Code quality
   - Risk: Low
   - Effort: 1 week

## Migration Pattern

### Step-by-Step Process

For each legacy file to migrate:

#### 1. Analysis (Day 1)
- Read and understand the legacy code
- Identify business logic vs. infrastructure
- Map to existing slices or determine if new slice needed
- Document dependencies

#### 2. Domain Layer (Day 1-2)
- Create value objects for data types
- Create entities for business concepts
- Define domain events
- Create repository interfaces
- Create domain services if needed

#### 3. Application Layer (Day 2-3)
- Create commands for write operations
- Create queries for read operations
- Create DTOs for data transfer
- Create handlers for commands/queries
- Create use cases if needed

#### 4. Infrastructure Layer (Day 3-4)
- Implement repository interfaces
- Create infrastructure services
- Set up DI bindings
- Configure external service clients

#### 5. Presentation Layer (Day 4-5)
- Create controllers/route handlers
- Map HTTP requests to commands/queries
- Add validation middleware
- Update API routes

#### 6. Testing (Day 5-6)
- Write unit tests for domain
- Write integration tests for application
- Write API tests for presentation
- Verify all tests pass

#### 7. Integration (Day 6-7)
- Update imports across codebase
- Test integration points
- Performance testing
- Documentation

#### 8. Cleanup (Day 7)
- Remove old code
- Update references
- Final testing
- Code review

## Testing Strategy

### Test Categories

#### 1. Domain Tests
```typescript
describe('User Entity', () => {
  it('should create user with valid data', () => {
    const user = User.create({...});
    expect(user.isSuccess).toBe(true);
  });

  it('should reject invalid email', () => {
    const user = User.create({
      email: Email.create('invalid')
    });
    expect(user.isFailure).toBe(true);
  });
});
```

#### 2. Application Tests
```typescript
describe('RegisterUserHandler', () => {
  it('should register new user', async () => {
    const handler = new RegisterUserHandler(mockRepo, mockService);
    const result = await handler.handle(command);
    expect(result.isSuccess).toBe(true);
  });
});
```

#### 3. Infrastructure Tests
```typescript
describe('PrismaUserRepository', () => {
  it('should save user to database', async () => {
    const repo = new PrismaUserRepository(prisma);
    await repo.save(user);
    const found = await repo.findById(user.id);
    expect(found).toBeDefined();
  });
});
```

#### 4. API Tests
```typescript
describe('POST /api/users', () => {
  it('should create user and return 201', async () => {
    const response = await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify({...})
    });
    expect(response.status).toBe(201);
  });
});
```

### Test Infrastructure

1. **Test Database**
   - Separate PostgreSQL instance for testing
   - Seed data with fixtures
   - Cleanup after each test

2. **Mocking Strategy**
   - Mock external services (email, SMS, etc.)
   - Mock infrastructure dependencies in unit tests
   - Use real implementations in integration tests

3. **Test Configuration**
   ```typescript
   // vitest.config.ts
   export default defineConfig({
     test: {
       environment: 'node',
       setupFiles: ['./test/setup.ts'],
       coverage: {
         provider: 'v8',
         reporter: ['text', 'json', 'html'],
         exclude: [...]
       }
     }
   });
   ```

## Risk Mitigation

### Migration Risks

1. **Breaking Changes**
   - **Risk:** Migration breaks existing functionality
   - **Mitigation:** Comprehensive testing, gradual rollout, feature flags

2. **Performance Regression**
   - **Risk:** New layers add overhead
   - **Mitigation:** Performance benchmarks, optimization phase

3. **Timeline Overrun**
   - **Risk:** Migration takes longer than expected
   - **Mitigation:** Prioritize critical paths, can defer P2/P3 items

4. **Knowledge Loss**
   - **Risk:** Team doesn't understand new architecture
   - **Mitigation:** Documentation, pair programming, knowledge sharing

### Rollback Strategy

1. **Feature Flags** - Toggle between old/new implementations
2. **Branching** - Keep legacy code in separate branch until verified
3. **Monitoring** - Watch for errors after deployment
4. **Quick Revert** - Ability to revert to previous version

## Success Metrics

### Quantitative Metrics
- ✅ 0 direct Prisma calls in presentation layer
- ✅ 100% layer separation (no cross-layer violations)
- ✅ 80%+ test coverage across all layers
- ✅ 100% of API routes using clean architecture
- ✅ 0 circular dependencies

### Qualitative Metrics
- ✅ Clear code organization
- ✅ Easy to test in isolation
- ✅ Business logic isolated from technical concerns
- ✅ Easy to swap implementations (DI working)
- ✅ Team understands and follows architecture

## Timeline

**Total Duration:** 12 weeks

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| 6.1 Critical API Routes | 3 weeks | Week 1 | Week 3 |
| 6.2 Service Migration | 3 weeks | Week 4 | Week 6 |
| 6.3 Utility Migration | 2 weeks | Week 7 | Week 8 |
| 6.4 Testing & Quality | 2 weeks | Week 9 | Week 10 |
| 6.5 Performance | 1 week | Week 11 | Week 11 |
| 6.6 Documentation | 1 week | Week 12 | Week 12 |

## Next Steps

1. ✅ **Completed:** Legacy code identification
2. **Current:** Creating detailed migration plans
3. **Next:** Start P0 migration with `app/api/reports/route.ts`
4. **Following:** Continue with remaining P0 items

## Resources

- [Clean Architecture Migration Plan](./clean-architecture-migration-plan.md)
- [Architecture Decision Records](../architecture/adr-001-di-container-standardization.md)
- [Testing Best Practices](../testing-guide.md) - To be created

---

**Document Version:** 1.0
**Last Updated:** 2025-01-13
**Status:** In Progress

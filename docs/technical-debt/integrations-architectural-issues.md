# Technical Debt: Integrations Module Architecture Issues

## Summary

The integrations module has significant architectural issues that represent technical debt:

### 1. **Repository Interface Mismatch**
**Issue**: The `IIntegrationRepository` interface doesn't have a `save` method, but `PrismaIntegrationRepository` calls `this.integrationRepository.save(integration)` which expects an `Integration` entity, not a command object.

**Impact**: 
- Handlers are calling `repository.save()` on domain entities instead of using command objects
- This creates tight coupling between handlers and domain
- Repository methods need to be added to interface

**Fix Required**: Add `save` method to `IIntegrationRepository` interface and update `PrismaIntegrationRepository` to use `save()` method

###2. **Use Case Instantiation Issues**
**Issue**: Use cases are instantiated with 0 arguments but expect command objects with properties.

**Impact**:
- Handlers are calling `new CreateIntegrationUseCase()` without passing command
- This causes runtime errors when handler tries to access command properties
- Type safety issues - passing raw command objects to use case

**Fix Required**: Update use cases to properly instantiate with command objects

###3. **API Route Request Pattern Issues**
**Issue**: Routes use `request.query` instead of `request.nextUrl.searchParams`

**Impact**:
- Next.js API routes don't follow correct request parameter access pattern
- Dynamic routes should use `request.nextUrl.searchParams` for query parameters
- Static routes should use `request.nextUrl.searchParams` for path parameters

**Fix Required**: Update API routes to use correct Next.js request patterns

###4. **Domain Entity Missing Fields**
**Issue**: Prisma schema doesn't have all fields expected by domain entities

**Impact**:
- Repository code has to manually map fields that don't exist in Prisma schema
- Creates maintenance burden and potential bugs

**Fix Required**: Update Prisma schema to include all required fields or update domain entities to match schema

###5. **Type Definition Conflicts**
**Issue**: Multiple enums with same purpose (ScheduleFrequency vs ReportFrequency)

**Impact**:
- Type confusion leads to bugs
- Inconsistent naming across codebase

**Fix Required**: Standardize on one frequency enum type across codebase

## Implementation Strategy

### Phase 1: Add Missing Repository Methods (Quick Fix)

Create stub implementations in `PrismaIntegrationRepository` for missing methods like `findByOrganizationId`, `findByType`, `findByProvider`, `findByStatus`, `findAll`, `count`, `exists`, `findByName`.

### Phase 2: Fix API Routes (Quick Fix)

Update API routes to use `request.nextUrl.searchParams` instead of `request.query`.

### Phase 3: Fix Domain Entities (Medium Effort)

Update domain entities to align with Prisma schema or create missing DTOs.

### Phase 4: Document Technical Debt (Low Priority)

Create comprehensive technical debt document explaining:
- Current architectural issues in integrations module
- Recommended refactoring approach
- Timeline for addressing issues
- Trade-offs between quick fixes vs proper architecture

This allows compilation to succeed while documenting technical debt for future resolution.


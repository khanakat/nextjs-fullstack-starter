import { 
  ReportLayout, 
  ReportLayoutProps, 
  ReportComponent, 
  ComponentType, 
  GridLayout,
  Position,
  Size,
  ComponentConfig
} from '../../../../shared/domain/reporting/value-objects/report-layout';
import { ValidationError } from '../../../../shared/domain/exceptions/validation-error';

describe('ReportLayout', () => {
  let validGrid: GridLayout;
  let validComponent: ReportComponent;
  let validProps: ReportLayoutProps;

  beforeEach(() => {
    validGrid = {
      columns: 12,
      rows: 8,
      gap: 16,
    };

    validComponent = {
      id: 'chart-1',
      type: ComponentType.CHART,
      position: { x: 0, y: 0 },
      size: { width: 6, height: 4 },
      config: {
        title: 'Sales Chart',
        chartType: 'bar',
        dataSource: 'sales-data',
      },
    };

    validProps = {
      components: [validComponent],
      grid: validGrid,
    };
  });

  describe('create', () => {
    it('should create ReportLayout with valid properties', () => {
      // Act
      const layout = ReportLayout.create(validProps);

      // Assert
      expect(layout).toBeInstanceOf(ReportLayout);
      expect(layout.components).toHaveLength(1);
      expect(layout.components[0]).toEqual(validComponent);
      expect(layout.grid).toEqual(validGrid);
    });

    it('should create ReportLayout with empty components array', () => {
      // Arrange
      const emptyProps = {
        components: [],
        grid: validGrid,
      };

      // Act
      const layout = ReportLayout.create(emptyProps);

      // Assert
      expect(layout.components).toHaveLength(0);
      expect(layout.grid).toEqual(validGrid);
    });

    it('should throw ValidationError when components is not an array', () => {
      // Arrange
      const invalidProps = {
        components: 'invalid' as any,
        grid: validGrid,
      };

      // Act & Assert
      expect(() => ReportLayout.create(invalidProps))
        .toThrow(ValidationError);
      expect(() => ReportLayout.create(invalidProps))
        .toThrow('Components must be an array');
    });

    it('should throw ValidationError when grid is missing', () => {
      // Arrange
      const invalidProps = {
        components: [],
        grid: null as any,
      };

      // Act & Assert
      expect(() => ReportLayout.create(invalidProps))
        .toThrow(ValidationError);
      expect(() => ReportLayout.create(invalidProps))
        .toThrow('Grid layout is required');
    });

    it('should throw ValidationError when grid has zero or negative columns', () => {
      // Arrange
      const invalidProps = {
        components: [],
        grid: { ...validGrid, columns: 0 },
      };

      // Act & Assert
      expect(() => ReportLayout.create(invalidProps))
        .toThrow(ValidationError);
      expect(() => ReportLayout.create(invalidProps))
        .toThrow('Grid must have positive columns and rows');
    });

    it('should throw ValidationError when grid has zero or negative rows', () => {
      // Arrange
      const invalidProps = {
        components: [],
        grid: { ...validGrid, rows: -1 },
      };

      // Act & Assert
      expect(() => ReportLayout.create(invalidProps))
        .toThrow(ValidationError);
      expect(() => ReportLayout.create(invalidProps))
        .toThrow('Grid must have positive columns and rows');
    });

    it('should throw ValidationError when grid gap is negative', () => {
      // Arrange
      const invalidProps = {
        components: [],
        grid: { ...validGrid, gap: -5 },
      };

      // Act & Assert
      expect(() => ReportLayout.create(invalidProps))
        .toThrow(ValidationError);
      expect(() => ReportLayout.create(invalidProps))
        .toThrow('Grid gap cannot be negative');
    });
  });

  describe('component validation', () => {
    it('should throw ValidationError when component has empty ID', () => {
      // Arrange
      const invalidComponent = {
        ...validComponent,
        id: '',
      };
      const invalidProps = {
        components: [invalidComponent],
        grid: validGrid,
      };

      // Act & Assert
      expect(() => ReportLayout.create(invalidProps))
        .toThrow(ValidationError);
      expect(() => ReportLayout.create(invalidProps))
        .toThrow('Component at index 0 must have a valid ID');
    });

    it('should throw ValidationError when component has whitespace-only ID', () => {
      // Arrange
      const invalidComponent = {
        ...validComponent,
        id: '   ',
      };
      const invalidProps = {
        components: [invalidComponent],
        grid: validGrid,
      };

      // Act & Assert
      expect(() => ReportLayout.create(invalidProps))
        .toThrow(ValidationError);
      expect(() => ReportLayout.create(invalidProps))
        .toThrow('Component at index 0 must have a valid ID');
    });

    it('should throw ValidationError when component has invalid type', () => {
      // Arrange
      const invalidComponent = {
        ...validComponent,
        type: 'INVALID_TYPE' as ComponentType,
      };
      const invalidProps = {
        components: [invalidComponent],
        grid: validGrid,
      };

      // Act & Assert
      expect(() => ReportLayout.create(invalidProps))
        .toThrow(ValidationError);
      expect(() => ReportLayout.create(invalidProps))
        .toThrow('Component at index 0 has invalid type: INVALID_TYPE');
    });

    it('should throw ValidationError when component position is negative', () => {
      // Arrange
      const invalidComponent = {
        ...validComponent,
        position: { x: -1, y: 0 },
      };
      const invalidProps = {
        components: [invalidComponent],
        grid: validGrid,
      };

      // Act & Assert
      expect(() => ReportLayout.create(invalidProps))
        .toThrow(ValidationError);
      expect(() => ReportLayout.create(invalidProps))
        .toThrow('Component at index 0 position cannot be negative');
    });

    it('should throw ValidationError when component size is zero or negative', () => {
      // Arrange
      const invalidComponent = {
        ...validComponent,
        size: { width: 0, height: 4 },
      };
      const invalidProps = {
        components: [invalidComponent],
        grid: validGrid,
      };

      // Act & Assert
      expect(() => ReportLayout.create(invalidProps))
        .toThrow(ValidationError);
      expect(() => ReportLayout.create(invalidProps))
        .toThrow('Component at index 0 size must be positive');
    });

    it('should throw ValidationError when component config is missing', () => {
      // Arrange
      const invalidComponent = {
        ...validComponent,
        config: null as any,
      };
      const invalidProps = {
        components: [invalidComponent],
        grid: validGrid,
      };

      // Act & Assert
      expect(() => ReportLayout.create(invalidProps))
        .toThrow(ValidationError);
      expect(() => ReportLayout.create(invalidProps))
        .toThrow('Component at index 0 must have valid config');
    });

    it('should throw ValidationError when component config is not an object', () => {
      // Arrange
      const invalidComponent = {
        ...validComponent,
        config: 'invalid' as any,
      };
      const invalidProps = {
        components: [invalidComponent],
        grid: validGrid,
      };

      // Act & Assert
      expect(() => ReportLayout.create(invalidProps))
        .toThrow(ValidationError);
      expect(() => ReportLayout.create(invalidProps))
        .toThrow('Component at index 0 must have valid config');
    });
  });

  describe('component overlap validation', () => {
    it('should throw ValidationError when components overlap', () => {
      // Arrange
      const component1 = {
        id: 'comp-1',
        type: ComponentType.CHART,
        position: { x: 0, y: 0 },
        size: { width: 4, height: 3 },
        config: { title: 'Chart 1' },
      };
      const component2 = {
        id: 'comp-2',
        type: ComponentType.TABLE,
        position: { x: 2, y: 1 }, // Overlaps with component1
        size: { width: 3, height: 3 },
        config: { title: 'Table 1' },
      };
      const invalidProps = {
        components: [component1, component2],
        grid: validGrid,
      };

      // Act & Assert
      expect(() => ReportLayout.create(invalidProps))
        .toThrow(ValidationError);
      expect(() => ReportLayout.create(invalidProps))
        .toThrow('Components comp-1 and comp-2 overlap');
    });

    it('should not throw error when components are adjacent but not overlapping', () => {
      // Arrange
      const component1 = {
        id: 'comp-1',
        type: ComponentType.CHART,
        position: { x: 0, y: 0 },
        size: { width: 4, height: 3 },
        config: { title: 'Chart 1' },
      };
      const component2 = {
        id: 'comp-2',
        type: ComponentType.TABLE,
        position: { x: 4, y: 0 }, // Adjacent to component1
        size: { width: 3, height: 3 },
        config: { title: 'Table 1' },
      };
      const validProps = {
        components: [component1, component2],
        grid: validGrid,
      };

      // Act & Assert
      expect(() => ReportLayout.create(validProps)).not.toThrow();
    });

    it('should handle edge case where components touch at corners', () => {
      // Arrange
      const component1 = {
        id: 'comp-1',
        type: ComponentType.CHART,
        position: { x: 0, y: 0 },
        size: { width: 2, height: 2 },
        config: { title: 'Chart 1' },
      };
      const component2 = {
        id: 'comp-2',
        type: ComponentType.TABLE,
        position: { x: 2, y: 2 }, // Touches at corner
        size: { width: 2, height: 2 },
        config: { title: 'Table 1' },
      };
      const validProps = {
        components: [component1, component2],
        grid: validGrid,
      };

      // Act & Assert
      expect(() => ReportLayout.create(validProps)).not.toThrow();
    });
  });

  describe('getters', () => {
    let layout: ReportLayout;

    beforeEach(() => {
      layout = ReportLayout.create(validProps);
    });

    it('should return immutable copy of components', () => {
      // Act
      const components1 = layout.components;
      const components2 = layout.components;

      // Assert
      expect(components1).toEqual(components2);
      expect(components1).not.toBe(components2); // Different arrays
      
      // Modify returned array should not affect original
      components1.push({
        id: 'new-comp',
        type: ComponentType.TEXT,
        position: { x: 6, y: 0 },
        size: { width: 2, height: 1 },
        config: { title: 'New Component' },
      });
      expect(layout.components).toHaveLength(1);
    });

    it('should return immutable copy of grid', () => {
      // Act
      const grid1 = layout.grid;
      const grid2 = layout.grid;

      // Assert
      expect(grid1).toEqual(grid2);
      expect(grid1).not.toBe(grid2); // Different objects
      
      // Modify returned object should not affect original
      grid1.columns = 20;
      expect(layout.grid.columns).toBe(12);
    });
  });

  describe('addComponent', () => {
    it('should create new layout with added component', () => {
      // Arrange
      const layout = ReportLayout.create(validProps);
      const newComponent: ReportComponent = {
        id: 'table-1',
        type: ComponentType.TABLE,
        position: { x: 6, y: 0 },
        size: { width: 4, height: 3 },
        config: { title: 'Data Table' },
      };

      // Act
      const updatedLayout = layout.addComponent(newComponent);

      // Assert
      expect(updatedLayout).not.toBe(layout); // New instance
      expect(updatedLayout.components).toHaveLength(2);
      expect(updatedLayout.components[1]).toEqual(newComponent);
      expect(layout.components).toHaveLength(1); // Original unchanged
    });

    it('should validate the new component and layout', () => {
      // Arrange
      const layout = ReportLayout.create(validProps);
      const overlappingComponent: ReportComponent = {
        id: 'overlapping',
        type: ComponentType.TABLE,
        position: { x: 2, y: 1 }, // Overlaps with existing component
        size: { width: 3, height: 3 },
        config: { title: 'Overlapping Table' },
      };

      // Act & Assert
      expect(() => layout.addComponent(overlappingComponent))
        .toThrow(ValidationError);
    });
  });

  describe('removeComponent', () => {
    it('should create new layout with component removed', () => {
      // Arrange
      const component2: ReportComponent = {
        id: 'table-1',
        type: ComponentType.TABLE,
        position: { x: 6, y: 0 },
        size: { width: 4, height: 3 },
        config: { title: 'Data Table' },
      };
      const layoutWithTwoComponents = ReportLayout.create({
        components: [validComponent, component2],
        grid: validGrid,
      });

      // Act
      const updatedLayout = layoutWithTwoComponents.removeComponent('chart-1');

      // Assert
      expect(updatedLayout).not.toBe(layoutWithTwoComponents);
      expect(updatedLayout.components).toHaveLength(1);
      expect(updatedLayout.components[0].id).toBe('table-1');
      expect(layoutWithTwoComponents.components).toHaveLength(2); // Original unchanged
    });

    it('should return same layout structure when component ID not found', () => {
      // Arrange
      const layout = ReportLayout.create(validProps);

      // Act
      const updatedLayout = layout.removeComponent('non-existent');

      // Assert
      expect(updatedLayout).not.toBe(layout); // Still creates new instance
      expect(updatedLayout.components).toHaveLength(1);
      expect(updatedLayout.components[0]).toEqual(validComponent);
    });
  });

  describe('updateComponent', () => {
    it('should create new layout with updated component', () => {
      // Arrange
      const layout = ReportLayout.create(validProps);
      const updates = {
        position: { x: 2, y: 1 },
        size: { width: 8, height: 5 },
      };

      // Act
      const updatedLayout = layout.updateComponent('chart-1', updates);

      // Assert
      expect(updatedLayout).not.toBe(layout);
      expect(updatedLayout.components[0].position).toEqual({ x: 2, y: 1 });
      expect(updatedLayout.components[0].size).toEqual({ width: 8, height: 5 });
      expect(updatedLayout.components[0].type).toBe(ComponentType.CHART); // Unchanged
      expect(layout.components[0].position).toEqual({ x: 0, y: 0 }); // Original unchanged
    });

    it('should validate updated component', () => {
      // Arrange
      const layout = ReportLayout.create(validProps);
      const invalidUpdates = {
        size: { width: -1, height: 3 }, // Invalid size
      };

      // Act & Assert
      expect(() => layout.updateComponent('chart-1', invalidUpdates))
        .toThrow(ValidationError);
    });

    it('should return same layout structure when component ID not found', () => {
      // Arrange
      const layout = ReportLayout.create(validProps);
      const updates = { position: { x: 5, y: 5 } };

      // Act
      const updatedLayout = layout.updateComponent('non-existent', updates);

      // Assert
      expect(updatedLayout).not.toBe(layout);
      expect(updatedLayout.components[0]).toEqual(validComponent); // Unchanged
    });
  });

  describe('updateGrid', () => {
    it('should create new layout with updated grid', () => {
      // Arrange
      const layout = ReportLayout.create(validProps);
      const newGrid: GridLayout = {
        columns: 16,
        rows: 10,
        gap: 20,
      };

      // Act
      const updatedLayout = layout.updateGrid(newGrid);

      // Assert
      expect(updatedLayout).not.toBe(layout);
      expect(updatedLayout.grid).toEqual(newGrid);
      expect(layout.grid).toEqual(validGrid); // Original unchanged
    });

    it('should validate new grid', () => {
      // Arrange
      const layout = ReportLayout.create(validProps);
      const invalidGrid: GridLayout = {
        columns: 0, // Invalid
        rows: 10,
        gap: 20,
      };

      // Act & Assert
      expect(() => layout.updateGrid(invalidGrid))
        .toThrow(ValidationError);
    });
  });

  describe('getComponent', () => {
    it('should return component when ID exists', () => {
      // Arrange
      const layout = ReportLayout.create(validProps);

      // Act
      const component = layout.getComponent('chart-1');

      // Assert
      expect(component).toEqual(validComponent);
    });

    it('should return undefined when ID does not exist', () => {
      // Arrange
      const layout = ReportLayout.create(validProps);

      // Act
      const component = layout.getComponent('non-existent');

      // Assert
      expect(component).toBeUndefined();
    });
  });

  describe('isValid', () => {
    it('should return true for valid layout', () => {
      // Arrange
      const layout = ReportLayout.create(validProps);

      // Act
      const isValid = layout.isValid();

      // Assert
      expect(isValid).toBe(true);
    });

    it('should return false for invalid layout (simulated)', () => {
      // Arrange
      const layout = ReportLayout.create(validProps);
      
      // Mock the validation to simulate failure
      const originalValidate = ReportLayout['validateStatic'];
      ReportLayout['validateStatic'] = jest.fn(() => {
        throw new ValidationError('Simulated validation error');
      });

      // Act
      const isValid = layout.isValid();

      // Assert
      expect(isValid).toBe(false);

      // Cleanup
      ReportLayout['validateStatic'] = originalValidate;
    });
  });

  describe('getTotalArea', () => {
    it('should calculate total area of all components', () => {
      // Arrange
      const component2: ReportComponent = {
        id: 'table-1',
        type: ComponentType.TABLE,
        position: { x: 6, y: 0 },
        size: { width: 4, height: 2 }, // Area: 8
        config: { title: 'Data Table' },
      };
      const layout = ReportLayout.create({
        components: [validComponent, component2], // validComponent area: 6 * 4 = 24
        grid: validGrid,
      });

      // Act
      const totalArea = layout.getTotalArea();

      // Assert
      expect(totalArea).toBe(32); // 24 + 8
    });

    it('should return 0 for layout with no components', () => {
      // Arrange
      const layout = ReportLayout.create({
        components: [],
        grid: validGrid,
      });

      // Act
      const totalArea = layout.getTotalArea();

      // Assert
      expect(totalArea).toBe(0);
    });
  });

  describe('fitsInGrid', () => {
    it('should return true when all components fit in grid', () => {
      // Arrange
      const layout = ReportLayout.create(validProps);

      // Act
      const fits = layout.fitsInGrid();

      // Assert
      expect(fits).toBe(true);
    });

    it('should return false when component exceeds grid width', () => {
      // Arrange
      const oversizedComponent: ReportComponent = {
        id: 'oversized',
        type: ComponentType.CHART,
        position: { x: 10, y: 0 },
        size: { width: 5, height: 2 }, // x + width = 15 > 12 columns
        config: { title: 'Oversized Chart' },
      };
      const layout = ReportLayout.create({
        components: [oversizedComponent],
        grid: validGrid,
      });

      // Act
      const fits = layout.fitsInGrid();

      // Assert
      expect(fits).toBe(false);
    });

    it('should return false when component exceeds grid height', () => {
      // Arrange
      const oversizedComponent: ReportComponent = {
        id: 'oversized',
        type: ComponentType.CHART,
        position: { x: 0, y: 6 },
        size: { width: 4, height: 5 }, // y + height = 11 > 8 rows
        config: { title: 'Oversized Chart' },
      };
      const layout = ReportLayout.create({
        components: [oversizedComponent],
        grid: validGrid,
      });

      // Act
      const fits = layout.fitsInGrid();

      // Assert
      expect(fits).toBe(false);
    });

    it('should return true for empty layout', () => {
      // Arrange
      const layout = ReportLayout.create({
        components: [],
        grid: validGrid,
      });

      // Act
      const fits = layout.fitsInGrid();

      // Assert
      expect(fits).toBe(true);
    });
  });

  describe('value object equality', () => {
    it('should be equal when all properties are the same', () => {
      // Arrange
      const layout1 = ReportLayout.create(validProps);
      const layout2 = ReportLayout.create(validProps);

      // Act & Assert
      expect(layout1.equals(layout2)).toBe(true);
    });

    it('should not be equal when components differ', () => {
      // Arrange
      const layout1 = ReportLayout.create(validProps);
      const differentComponent = {
        ...validComponent,
        id: 'different-id',
      };
      const layout2 = ReportLayout.create({
        ...validProps,
        components: [differentComponent],
      });

      // Act & Assert
      expect(layout1.equals(layout2)).toBe(false);
    });

    it('should not be equal when grid differs', () => {
      // Arrange
      const layout1 = ReportLayout.create(validProps);
      const layout2 = ReportLayout.create({
        ...validProps,
        grid: { ...validGrid, columns: 16 },
      });

      // Act & Assert
      expect(layout1.equals(layout2)).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should not allow direct modification of internal state', () => {
      // Arrange
      const layout = ReportLayout.create(validProps);

      // Act - Try to modify returned objects
      const components = layout.components;
      const grid = layout.grid;
      
      components.push({
        id: 'new-comp',
        type: ComponentType.TEXT,
        position: { x: 8, y: 0 },
        size: { width: 2, height: 1 },
        config: { title: 'New Component' },
      });
      grid.columns = 20;

      // Assert - Original layout should be unchanged
      expect(layout.components).toHaveLength(1);
      expect(layout.grid.columns).toBe(12);
    });

    it('should create new instances when updating', () => {
      // Arrange
      const layout = ReportLayout.create(validProps);
      const newComponent: ReportComponent = {
        id: 'new-comp',
        type: ComponentType.TEXT,
        position: { x: 8, y: 0 },
        size: { width: 2, height: 1 },
        config: { title: 'New Component' },
      };

      // Act
      const withAddedComponent = layout.addComponent(newComponent);
      const withRemovedComponent = layout.removeComponent('chart-1');
      const withUpdatedGrid = layout.updateGrid({ ...validGrid, columns: 16 });

      // Assert
      expect(withAddedComponent).not.toBe(layout);
      expect(withRemovedComponent).not.toBe(layout);
      expect(withUpdatedGrid).not.toBe(layout);
      expect(withAddedComponent).not.toBe(withRemovedComponent);
    });
  });
});
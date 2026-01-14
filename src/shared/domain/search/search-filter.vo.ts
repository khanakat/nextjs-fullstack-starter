import { ValueObject } from '../value-object.base';

export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'exists';

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value?: any;
  values?: any[];
}

export interface SearchFilterProps {
  conditions: FilterCondition[];
  logic?: 'AND' | 'OR';
}

export class SearchFilter extends ValueObject<SearchFilterProps> {
  get conditions(): FilterCondition[] {
    return this.props.conditions;
  }

  get logic(): 'AND' | 'OR' {
    return this.props.logic || 'AND';
  }

  private constructor(props: SearchFilterProps) {
    super(props);
  }

  static create(props: SearchFilterProps): SearchFilter {
    if (props.conditions.length === 0) {
      throw new Error('At least one filter condition is required');
    }

    // Validate conditions
    for (const condition of props.conditions) {
      if (!condition.field) {
        throw new Error('Filter field is required');
      }

      if (!['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'exists'].includes(condition.operator)) {
        throw new Error(`Invalid filter operator: ${condition.operator}`);
      }

      if (condition.operator === 'in' || condition.operator === 'nin') {
        if (!condition.values || condition.values.length === 0) {
          throw new Error(`Filter operator '${condition.operator}' requires values array`);
        }
      } else if (condition.operator !== 'exists') {
        if (condition.value === undefined) {
          throw new Error(`Filter operator '${condition.operator}' requires a value`);
        }
      }
    }

    return new SearchFilter({
      conditions: props.conditions,
      logic: props.logic || 'AND',
    });
  }

  toQuery(): Record<string, any> {
    const query: Record<string, any> = this.logic === 'AND' ? { must: [] } : { should: [] };

    for (const condition of this.conditions) {
      const filter: Record<string, any> = {};

      switch (condition.operator) {
        case 'eq':
          filter.term = { [condition.field]: condition.value };
          break;
        case 'ne':
          filter.must_not = { term: { [condition.field]: condition.value } };
          break;
        case 'gt':
          filter.range = { [condition.field]: { gt: condition.value } };
          break;
        case 'gte':
          filter.range = { [condition.field]: { gte: condition.value } };
          break;
        case 'lt':
          filter.range = { [condition.field]: { lt: condition.value } };
          break;
        case 'lte':
          filter.range = { [condition.field]: { lte: condition.value } };
          break;
        case 'in':
          filter.terms = { [condition.field]: condition.values };
          break;
        case 'nin':
          filter.must_not = { terms: { [condition.field]: condition.values } };
          break;
        case 'exists':
          filter.exists = { field: condition.field };
          break;
      }

      if (this.logic === 'AND') {
        query.must.push(filter);
      } else {
        query.should.push(filter);
      }
    }

    return { bool: query };
  }
}

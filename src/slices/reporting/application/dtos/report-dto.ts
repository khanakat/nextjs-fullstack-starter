import { Dto } from '../../../../shared/application/base/dto';

/**
 * Report DTO for data transfer between layers
 */
export class ReportDto extends Dto {
  public readonly title: string;
  public readonly description?: string;
  public readonly status: string;
  public readonly isPublic: boolean;
  // Derived flag for convenience in tests and consumers
  public get isArchived(): boolean {
    return this.status === 'ARCHIVED';
  }
  public readonly templateId?: string;
  public readonly createdBy: string;
  public readonly organizationId?: string;
  public readonly publishedAt?: Date;
  public readonly archivedAt?: Date;
  public readonly config: ReportConfigDto;

  constructor(
    id: string,
    title: string,
    status: string,
    isPublic: boolean,
    createdBy: string,
    config: ReportConfigDto,
    createdAt: Date,
    updatedAt?: Date,
    description?: string,
    templateId?: string,
    organizationId?: string,
    publishedAt?: Date,
    archivedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
    this.title = title;
    this.description = description;
    this.status = status;
    this.isPublic = isPublic;
    this.templateId = templateId;
    this.createdBy = createdBy;
    this.organizationId = organizationId;
    this.publishedAt = publishedAt;
    this.archivedAt = archivedAt;
    this.config = config;
  }
}

/**
 * Report Configuration DTO
 */
export class ReportConfigDto {
  public readonly title: string;
  public readonly description?: string;
  public readonly filters: Record<string, any>;
  public readonly parameters: Record<string, any>;
  public readonly layout: ReportLayoutDto;
  public readonly styling: ReportStylingDto;

  constructor(
    title: string,
    filters: Record<string, any>,
    parameters: Record<string, any>,
    layout: ReportLayoutDto,
    styling: ReportStylingDto,
    description?: string
  ) {
    this.title = title;
    this.description = description;
    this.filters = filters;
    this.parameters = parameters;
    this.layout = layout;
    this.styling = styling;
  }

  public toPlainObject(): Record<string, any> {
    return {
      title: this.title,
      description: this.description,
      filters: this.filters,
      parameters: this.parameters,
      layout: this.layout.toPlainObject(),
      styling: this.styling.toPlainObject(),
    };
  }
}

/**
 * Report Layout DTO
 */
export class ReportLayoutDto {
  public readonly type: 'grid' | 'flow' | 'fixed';
  public readonly components: ReportComponentDto[];
  public readonly grid: GridLayoutDto;

  constructor(
    type: 'grid' | 'flow' | 'fixed',
    components: ReportComponentDto[],
    grid: GridLayoutDto
  ) {
    this.type = type;
    this.components = components;
    this.grid = grid;
  }

  public toPlainObject(): Record<string, any> {
    return {
      type: this.type,
      components: this.components.map(c => c.toPlainObject()),
      grid: this.grid.toPlainObject(),
    };
  }
}

/**
 * Report Component DTO
 */
export class ReportComponentDto {
  public readonly id: string;
  public readonly type: string;
  public readonly position: PositionDto;
  public readonly size: SizeDto;
  public readonly config: Record<string, any>;

  constructor(
    id: string,
    type: string,
    position: PositionDto,
    size: SizeDto,
    config: Record<string, any>
  ) {
    this.id = id;
    this.type = type;
    this.position = position;
    this.size = size;
    this.config = config;
  }

  public toPlainObject(): Record<string, any> {
    return {
      id: this.id,
      type: this.type,
      position: this.position.toPlainObject(),
      size: this.size.toPlainObject(),
      config: this.config,
    };
  }
}

/**
 * Position DTO
 */
export class PositionDto {
  public readonly x: number;
  public readonly y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public toPlainObject(): Record<string, any> {
    return {
      x: this.x,
      y: this.y,
    };
  }
}

/**
 * Size DTO
 */
export class SizeDto {
  public readonly width: number;
  public readonly height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  public toPlainObject(): Record<string, any> {
    return {
      width: this.width,
      height: this.height,
    };
  }
}

/**
 * Grid Layout DTO
 */
export class GridLayoutDto {
  public readonly columns: number;
  public readonly rows: number;
  public readonly gap: number;

  constructor(columns: number, rows: number, gap: number) {
    this.columns = columns;
    this.rows = rows;
    this.gap = gap;
  }

  public toPlainObject(): Record<string, any> {
    return {
      columns: this.columns,
      rows: this.rows,
      gap: this.gap,
    };
  }
}

/**
 * Report Styling DTO
 */
export class ReportStylingDto {
  public readonly theme: string;
  public readonly colors: ColorSchemeDto;
  public readonly fonts: FontConfigDto;
  public readonly spacing: SpacingConfigDto;

  constructor(
    theme: string,
    colors: ColorSchemeDto,
    fonts: FontConfigDto,
    spacing: SpacingConfigDto
  ) {
    this.theme = theme;
    this.colors = colors;
    this.fonts = fonts;
    this.spacing = spacing;
  }

  public toPlainObject(): Record<string, any> {
    return {
      theme: this.theme,
      colors: this.colors.toPlainObject(),
      fonts: this.fonts.toPlainObject(),
      spacing: this.spacing.toPlainObject(),
    };
  }
}

/**
 * Color Scheme DTO
 */
export class ColorSchemeDto {
  public readonly primary: string;
  public readonly secondary: string;
  public readonly accent: string;
  public readonly background: string;
  public readonly text: string;

  constructor(
    primary: string,
    secondary: string,
    accent: string,
    background: string,
    text: string
  ) {
    this.primary = primary;
    this.secondary = secondary;
    this.accent = accent;
    this.background = background;
    this.text = text;
  }

  public toPlainObject(): Record<string, any> {
    return {
      primary: this.primary,
      secondary: this.secondary,
      accent: this.accent,
      background: this.background,
      text: this.text,
    };
  }
}

/**
 * Font Configuration DTO
 */
export class FontConfigDto {
  public readonly family: string;
  public readonly sizes: Record<string, number>;
  public readonly weights: Record<string, number>;

  constructor(
    family: string,
    sizes: Record<string, number>,
    weights: Record<string, number>
  ) {
    this.family = family;
    this.sizes = sizes;
    this.weights = weights;
  }

  public toPlainObject(): Record<string, any> {
    return {
      family: this.family,
      sizes: this.sizes,
      weights: this.weights,
    };
  }
}

/**
 * Spacing Configuration DTO
 */
export class SpacingConfigDto {
  public readonly unit: number;
  public readonly scale: number[];

  constructor(unit: number, scale: number[]) {
    this.unit = unit;
    this.scale = scale;
  }

  public toPlainObject(): Record<string, any> {
    return {
      unit: this.unit,
      scale: this.scale,
    };
  }
}
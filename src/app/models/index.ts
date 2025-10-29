// Exportar todos los modelos desde un punto central
export * from './media-item.model';
export * from './tag.model';
export * from './media-tag.model';

/**
 * Tipos de respuesta para operaciones de la API
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Opciones de paginación para listas grandes
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  offset?: number;
}

/**
 * Resultado paginado
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Filtros para la galería de medios
 */
export interface MediaFilter {
  /** Filtrar por tipo de medio */
  type?: 'photo' | 'video' | 'all';
  
  /** Filtrar por etiquetas (OR logic) */
  tagIds?: number[];
  
  /** Filtrar por rango de fechas */
  dateFrom?: Date;
  dateTo?: Date;
  
  /** Búsqueda por nombre de archivo */
  filename?: string;
}

/**
 * Configuración de la aplicación
 */
export interface AppConfig {
  version: string;
  course: string;
  courseCode: string;
  releaseDate: string;
  developers: Developer[];
}

/**
 * Información de desarrolladores
 */
export interface Developer {
  name: string;
  email: string;
  role?: string;
}
/**
 * Modelo para la tabla de asociación Many-to-Many entre MediaItem y Tag
 * Implementa la relación *..*) especificada en el diagrama ER
 */
export interface MediaTag {
  /** Identificador del medio (FK a MediaItem.mediaId) */
  mediaId: string;
  
  /** Identificador de la etiqueta (FK a Tag.tagId) */
  tagId: number;
  
  /** Fecha en que se asignó la etiqueta al medio */
  fechaAsignacion?: Date;
  
  /** Usuario que asignó la etiqueta (si hay múltiples usuarios) */
  asignadoPor?: string;
}

/**
 * Interfaz para crear una nueva asociación media-tag
 */
export interface CreateMediaTagDto {
  mediaId: string;
  tagId: number;
  asignadoPor?: string;
}

/**
 * Interfaz para consultas de asociaciones
 */
export interface MediaTagQuery {
  /** Filtrar por ID de medio específico */
  mediaId?: string;
  
  /** Filtrar por ID de etiqueta específico */
  tagId?: number;
  
  /** Filtrar por múltiples IDs de etiquetas */
  tagIds?: number[];
  
  /** Filtrar por múltiples IDs de medios */
  mediaIds?: string[];
}

/**
 * Resultado de consulta que incluye información adicional
 */
export interface MediaTagResult extends MediaTag {
  /** Información del medio asociado */
  mediaItem?: any;
  
  /** Información de la etiqueta asociada */
  tag?: any;
}
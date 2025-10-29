/**
 * Modelo de Tag según el diagrama ER
 * Representa una etiqueta que puede ser asignada a medios
 */
export interface Tag {
  /** Identificador único de la etiqueta (PK) */
  tagId: number;
  
  /** Nombre de la etiqueta (ej. "Personal", "Trabajo", "Diversión") */
  nombre: string;
  
  /** Color asociado a la etiqueta para visualización (hexadecimal) */
  color?: string;
  
  /** Descripción opcional de la etiqueta */
  descripcion?: string;
  
  /** Fecha de creación de la etiqueta */
  fechaCreacion?: Date;
  
  /** Indica si la etiqueta es del sistema o creada por el usuario */
  esEtiquetaSistema?: boolean;
}

/**
 * Interfaz para crear una nueva etiqueta (sin ID)
 */
export interface CreateTagDto {
  nombre: string;
  color?: string;
  descripcion?: string;
  esEtiquetaSistema?: boolean;
}

/**
 * Interfaz para actualizar una etiqueta existente
 */
export interface UpdateTagDto {
  nombre?: string;
  color?: string;
  descripcion?: string;
}
/**
 * Modelo de MediaItem según el diagrama ER
 * Representa un elemento multimedia (foto o video) en la galería
 */
export interface MediaItem {
  /** Identificador único del medio (PK) - URI persistente del archivo */
  mediaId: string;
  
  /** URI del archivo multimedia */
  uri: string;
  
  /** Tipo de medio: 'photo' o 'video' */
  type: 'photo' | 'video';
  
  /** Nombre del archivo */
  filename?: string;
  
  /** Fecha de creación/captura */
  dateCreated?: Date;
  
  /** Tamaño del archivo en bytes */
  size?: number;
  
  /** Ancho de la imagen/video */
  width?: number;
  
  /** Altura de la imagen/video */
  height?: number;
  
  /** Duración del video en segundos (solo para videos) */
  duration?: number;
}

/**
 * Extensión del MediaItem que incluye las etiquetas asociadas
 */
export interface MediaItemWithTags extends MediaItem {
  /** Lista de etiquetas asociadas a este medio */
  tags: Tag[];
}

/**
 * Importar Tag para la extensión
 */
import { Tag } from './tag.model';
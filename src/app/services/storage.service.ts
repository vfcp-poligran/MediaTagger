import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Tag, MediaTag, CreateTagDto, UpdateTagDto, CreateMediaTagDto, MediaTagQuery } from '../models';

/**
 * Servicio de almacenamiento para gestionar operaciones CRUD con SQLite
 * Cumple con RA-001, RA-002, RA-003, RA-004, RA-005
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private _storage: Storage | null = null;
  private isInitialized = false;

  constructor(private storage: Storage) {
    this.init();
  }

  /**
   * Inicializar el almacenamiento SQLite
   */
  async init(): Promise<void> {
    try {
      // Crear la instancia de storage con SQLite como driver preferido
      const storage = await this.storage.create();
      this._storage = storage;
      
      // Crear las tablas necesarias
      await this.createTables();
      this.isInitialized = true;
      
      console.log('Storage inicializado con SQLite');
    } catch (error) {
      console.error('Error inicializando storage:', error);
      throw error;
    }
  }

  /**
   * Crear las tablas de la base de datos
   */
  private async createTables(): Promise<void> {
    if (!this._storage) return;

    try {
      // Inicializar contadores si no existen
      const tagCounter = await this._storage.get('tag_counter');
      if (tagCounter === null) {
        await this._storage.set('tag_counter', 0);
      }

      // Inicializar arrays de datos si no existen
      const tags = await this._storage.get('tags');
      if (!tags) {
        await this._storage.set('tags', []);
      }

      const mediaTags = await this._storage.get('media_tags');
      if (!mediaTags) {
        await this._storage.set('media_tags', []);
      }

      console.log('Tablas creadas correctamente');
    } catch (error) {
      console.error('Error creando tablas:', error);
      throw error;
    }
  }

  /**
   * Verificar que el storage esté inicializado
   */
  private async ensureStorage(): Promise<Storage> {
    if (!this.isInitialized || !this._storage) {
      await this.init();
    }
    return this._storage!;
  }

  // =================== OPERACIONES DE ETIQUETAS (RA-003) ===================

  /**
   * Crear una nueva etiqueta
   */
  async createTag(tagData: CreateTagDto): Promise<Tag> {
    const storage = await this.ensureStorage();
    
    try {
      // Obtener el siguiente ID
      const counter = await storage.get('tag_counter') || 0;
      const newId = counter + 1;
      
      // Crear la etiqueta
      const newTag: Tag = {
        tagId: newId,
        nombre: tagData.nombre,
        color: tagData.color || this.generateRandomColor(),
        descripcion: tagData.descripcion,
        fechaCreacion: new Date(),
        esEtiquetaSistema: tagData.esEtiquetaSistema || false
      };

      // Obtener tags existentes
      const tags: Tag[] = await storage.get('tags') || [];
      tags.push(newTag);

      // Guardar
      await storage.set('tags', tags);
      await storage.set('tag_counter', newId);

      return newTag;
    } catch (error) {
      console.error('Error creando etiqueta:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las etiquetas
   */
  async getAllTags(): Promise<Tag[]> {
    const storage = await this.ensureStorage();
    
    try {
      const tags: Tag[] = await storage.get('tags') || [];
      return tags.sort((a, b) => a.nombre.localeCompare(b.nombre));
    } catch (error) {
      console.error('Error obteniendo etiquetas:', error);
      return [];
    }
  }

  /**
   * Obtener etiqueta por ID
   */
  async getTagById(tagId: number): Promise<Tag | null> {
    const storage = await this.ensureStorage();
    
    try {
      const tags: Tag[] = await storage.get('tags') || [];
      return tags.find(tag => tag.tagId === tagId) || null;
    } catch (error) {
      console.error('Error obteniendo etiqueta:', error);
      return null;
    }
  }

  /**
   * Actualizar una etiqueta
   */
  async updateTag(tagId: number, updateData: UpdateTagDto): Promise<Tag | null> {
    const storage = await this.ensureStorage();
    
    try {
      const tags: Tag[] = await storage.get('tags') || [];
      const index = tags.findIndex(tag => tag.tagId === tagId);
      
      if (index === -1) return null;

      // Actualizar los campos
      const updatedTag = {
        ...tags[index],
        ...updateData
      };

      tags[index] = updatedTag;
      await storage.set('tags', tags);

      return updatedTag;
    } catch (error) {
      console.error('Error actualizando etiqueta:', error);
      throw error;
    }
  }

  /**
   * Eliminar una etiqueta y todas sus asociaciones
   */
  async deleteTag(tagId: number): Promise<boolean> {
    const storage = await this.ensureStorage();
    
    try {
      // Eliminar la etiqueta
      const tags: Tag[] = await storage.get('tags') || [];
      const filteredTags = tags.filter(tag => tag.tagId !== tagId);
      await storage.set('tags', filteredTags);

      // Eliminar todas las asociaciones de esta etiqueta (RF-005)
      const mediaTags: MediaTag[] = await storage.get('media_tags') || [];
      const filteredMediaTags = mediaTags.filter(mt => mt.tagId !== tagId);
      await storage.set('media_tags', filteredMediaTags);

      return true;
    } catch (error) {
      console.error('Error eliminando etiqueta:', error);
      return false;
    }
  }

  // =============== OPERACIONES DE ASOCIACIONES MEDIA-TAG (RA-004) ===============

  /**
   * Asignar una etiqueta a un medio
   */
  async assignTagToMedia(data: CreateMediaTagDto): Promise<MediaTag> {
    const storage = await this.ensureStorage();
    
    try {
      const mediaTags: MediaTag[] = await storage.get('media_tags') || [];
      
      // Verificar si ya existe la asociación
      const exists = mediaTags.some(mt => 
        mt.mediaId === data.mediaId && mt.tagId === data.tagId
      );

      if (exists) {
        throw new Error('La etiqueta ya está asignada a este medio');
      }

      // Crear nueva asociación
      const newMediaTag: MediaTag = {
        mediaId: data.mediaId,
        tagId: data.tagId,
        fechaAsignacion: new Date(),
        asignadoPor: data.asignadoPor
      };

      mediaTags.push(newMediaTag);
      await storage.set('media_tags', mediaTags);

      return newMediaTag;
    } catch (error) {
      console.error('Error asignando etiqueta:', error);
      throw error;
    }
  }

  /**
   * Desasignar una etiqueta de un medio
   */
  async unassignTagFromMedia(mediaId: string, tagId: number): Promise<boolean> {
    const storage = await this.ensureStorage();
    
    try {
      const mediaTags: MediaTag[] = await storage.get('media_tags') || [];
      const filteredMediaTags = mediaTags.filter(mt => 
        !(mt.mediaId === mediaId && mt.tagId === tagId)
      );

      await storage.set('media_tags', filteredMediaTags);
      return true;
    } catch (error) {
      console.error('Error desasignando etiqueta:', error);
      return false;
    }
  }

  /**
   * Obtener todas las etiquetas de un medio específico
   */
  async getTagsForMedia(mediaId: string): Promise<Tag[]> {
    const storage = await this.ensureStorage();
    
    try {
      const mediaTags: MediaTag[] = await storage.get('media_tags') || [];
      const tags: Tag[] = await storage.get('tags') || [];

      const mediaTagIds = mediaTags
        .filter(mt => mt.mediaId === mediaId)
        .map(mt => mt.tagId);

      return tags.filter(tag => mediaTagIds.includes(tag.tagId));
    } catch (error) {
      console.error('Error obteniendo etiquetas del medio:', error);
      return [];
    }
  }

  /**
   * Obtener todos los medios que tienen una etiqueta específica
   */
  async getMediaForTag(tagId: number): Promise<string[]> {
    const storage = await this.ensureStorage();
    
    try {
      const mediaTags: MediaTag[] = await storage.get('media_tags') || [];
      return mediaTags
        .filter(mt => mt.tagId === tagId)
        .map(mt => mt.mediaId);
    } catch (error) {
      console.error('Error obteniendo medios de la etiqueta:', error);
      return [];
    }
  }

  /**
   * Obtener medios que tienen TODAS las etiquetas especificadas (AND logic)
   */
  async getMediaWithAllTags(tagIds: number[]): Promise<string[]> {
    const storage = await this.ensureStorage();
    
    try {
      const mediaTags: MediaTag[] = await storage.get('media_tags') || [];
      
      // Obtener todos los mediaIds únicos
      const allMediaIds = [...new Set(mediaTags.map(mt => mt.mediaId))];
      
      // Filtrar medios que tienen TODAS las etiquetas
      return allMediaIds.filter(mediaId => {
        const mediaTagIds = mediaTags
          .filter(mt => mt.mediaId === mediaId)
          .map(mt => mt.tagId);
        
        return tagIds.every(tagId => mediaTagIds.includes(tagId));
      });
    } catch (error) {
      console.error('Error obteniendo medios con todas las etiquetas:', error);
      return [];
    }
  }

  /**
   * Obtener medios que tienen CUALQUIERA de las etiquetas especificadas (OR logic)
   */
  async getMediaWithAnyTags(tagIds: number[]): Promise<string[]> {
    const storage = await this.ensureStorage();
    
    try {
      const mediaTags: MediaTag[] = await storage.get('media_tags') || [];
      
      const matchingMediaIds = mediaTags
        .filter(mt => tagIds.includes(mt.tagId))
        .map(mt => mt.mediaId);

      return [...new Set(matchingMediaIds)];
    } catch (error) {
      console.error('Error obteniendo medios con cualquier etiqueta:', error);
      return [];
    }
  }

  /**
   * Eliminar todas las asociaciones de un medio específico
   */
  async removeAllTagsFromMedia(mediaId: string): Promise<boolean> {
    const storage = await this.ensureStorage();
    
    try {
      const mediaTags: MediaTag[] = await storage.get('media_tags') || [];
      const filteredMediaTags = mediaTags.filter(mt => mt.mediaId !== mediaId);
      await storage.set('media_tags', filteredMediaTags);
      return true;
    } catch (error) {
      console.error('Error eliminando todas las etiquetas del medio:', error);
      return false;
    }
  }

  // ===================== UTILIDADES ======================

  /**
   * Generar un color aleatorio para las etiquetas
   */
  private generateRandomColor(): string {
    const colors = [
      '#3880ff', '#10dc60', '#ffce00', '#f04141', '#7044ff',
      '#36dcd8', '#5260ff', '#50c878', '#ffc409', '#eb445a'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Limpiar toda la base de datos (útil para testing)
   */
  async clearAllData(): Promise<void> {
    const storage = await this.ensureStorage();
    
    try {
      await storage.set('tags', []);
      await storage.set('media_tags', []);
      await storage.set('tag_counter', 0);
      console.log('Todos los datos eliminados');
    } catch (error) {
      console.error('Error limpiando datos:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas del almacenamiento
   */
  async getStorageStats(): Promise<{
    totalTags: number;
    totalAssociations: number;
    uniqueMediaCount: number;
  }> {
    const storage = await this.ensureStorage();
    
    try {
      const tags: Tag[] = await storage.get('tags') || [];
      const mediaTags: MediaTag[] = await storage.get('media_tags') || [];
      const uniqueMediaIds = new Set(mediaTags.map(mt => mt.mediaId));

      return {
        totalTags: tags.length,
        totalAssociations: mediaTags.length,
        uniqueMediaCount: uniqueMediaIds.size
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return { totalTags: 0, totalAssociations: 0, uniqueMediaCount: 0 };
    }
  }
}
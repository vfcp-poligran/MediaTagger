import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Tag, CreateTagDto, UpdateTagDto, MediaTag, CreateMediaTagDto } from '../models';
import { StorageService } from './storage.service';

/**
 * Servicio para gestionar etiquetas y sus asociaciones con medios
 * Cumple con RF-003, RF-004, RF-005, RF-006, RF-007
 */
@Injectable({
  providedIn: 'root'
})
export class TagService {
  private tagsSubject = new BehaviorSubject<Tag[]>([]);
  public tags$: Observable<Tag[]> = this.tagsSubject.asObservable();

  constructor(private storageService: StorageService) {
    this.loadTags();
  }

  // =================== GESTIÓN DE ETIQUETAS (RF-003, RF-004, RF-005) ===================

  /**
   * Crear una nueva etiqueta (RF-003)
   */
  async createTag(tagData: CreateTagDto): Promise<Tag | null> {
    try {
      // Validar que no existe una etiqueta con el mismo nombre
      const existingTags = await this.storageService.getAllTags();
      const exists = existingTags.some(tag => 
        tag.nombre.toLowerCase() === tagData.nombre.toLowerCase()
      );

      if (exists) {
        throw new Error(`Ya existe una etiqueta con el nombre "${tagData.nombre}"`);
      }

      const newTag = await this.storageService.createTag(tagData);
      await this.loadTags(); // Actualizar la lista
      return newTag;

    } catch (error) {
      console.error('Error creando etiqueta:', error);
      return null;
    }
  }

  /**
   * Obtener todas las etiquetas (RF-004)
   */
  async getAllTags(): Promise<Tag[]> {
    try {
      const tags = await this.storageService.getAllTags();
      this.tagsSubject.next(tags);
      return tags;
    } catch (error) {
      console.error('Error obteniendo etiquetas:', error);
      return [];
    }
  }

  /**
   * Obtener etiqueta por ID
   */
  async getTagById(tagId: number): Promise<Tag | null> {
    try {
      return await this.storageService.getTagById(tagId);
    } catch (error) {
      console.error('Error obteniendo etiqueta por ID:', error);
      return null;
    }
  }

  /**
   * Actualizar una etiqueta existente
   */
  async updateTag(tagId: number, updateData: UpdateTagDto): Promise<Tag | null> {
    try {
      // Validar que no existe otra etiqueta con el mismo nombre (si se está cambiando el nombre)
      if (updateData.nombre) {
        const existingTags = await this.storageService.getAllTags();
        const exists = existingTags.some(tag => 
          tag.tagId !== tagId && 
          tag.nombre.toLowerCase() === updateData.nombre!.toLowerCase()
        );

        if (exists) {
          throw new Error(`Ya existe otra etiqueta con el nombre "${updateData.nombre}"`);
        }
      }

      const updatedTag = await this.storageService.updateTag(tagId, updateData);
      if (updatedTag) {
        await this.loadTags(); // Actualizar la lista
      }
      return updatedTag;

    } catch (error) {
      console.error('Error actualizando etiqueta:', error);
      return null;
    }
  }

  /**
   * Eliminar una etiqueta (RF-005)
   * Al eliminar una etiqueta, se desvinculará de todos los medios asociados
   */
  async deleteTag(tagId: number): Promise<boolean> {
    try {
      const success = await this.storageService.deleteTag(tagId);
      if (success) {
        await this.loadTags(); // Actualizar la lista
      }
      return success;

    } catch (error) {
      console.error('Error eliminando etiqueta:', error);
      return false;
    }
  }

  // =============== GESTIÓN DE ASOCIACIONES MEDIA-TAG (RF-006, RF-007) ===============

  /**
   * Asignar una etiqueta a un medio (RF-006)
   */
  async assignTagToMedia(mediaId: string, tagId: number): Promise<boolean> {
    try {
      const mediaTag = await this.storageService.assignTagToMedia({
        mediaId,
        tagId,
        asignadoPor: 'user'
      });
      return !!mediaTag;

    } catch (error) {
      console.error('Error asignando etiqueta al medio:', error);
      return false;
    }
  }

  /**
   * Asignar múltiples etiquetas a un medio (RF-006)
   */
  async assignMultipleTagsToMedia(mediaId: string, tagIds: number[]): Promise<number> {
    let successCount = 0;
    
    for (const tagId of tagIds) {
      const success = await this.assignTagToMedia(mediaId, tagId);
      if (success) successCount++;
    }

    return successCount;
  }

  /**
   * Desasignar una etiqueta de un medio (RF-007)
   */
  async unassignTagFromMedia(mediaId: string, tagId: number): Promise<boolean> {
    try {
      return await this.storageService.unassignTagFromMedia(mediaId, tagId);

    } catch (error) {
      console.error('Error desasignando etiqueta del medio:', error);
      return false;
    }
  }

  /**
   * Desasignar múltiples etiquetas de un medio (RF-007)
   */
  async unassignMultipleTagsFromMedia(mediaId: string, tagIds: number[]): Promise<number> {
    let successCount = 0;
    
    for (const tagId of tagIds) {
      const success = await this.unassignTagFromMedia(mediaId, tagId);
      if (success) successCount++;
    }

    return successCount;
  }

  /**
   * Obtener todas las etiquetas asignadas a un medio específico
   */
  async getTagsForMedia(mediaId: string): Promise<Tag[]> {
    try {
      return await this.storageService.getTagsForMedia(mediaId);
    } catch (error) {
      console.error('Error obteniendo etiquetas del medio:', error);
      return [];
    }
  }

  /**
   * Obtener todos los medios que tienen una etiqueta específica
   */
  async getMediaForTag(tagId: number): Promise<string[]> {
    try {
      return await this.storageService.getMediaForTag(tagId);
    } catch (error) {
      console.error('Error obteniendo medios de la etiqueta:', error);
      return [];
    }
  }

  /**
   * Verificar si un medio tiene una etiqueta específica
   */
  async hasTag(mediaId: string, tagId: number): Promise<boolean> {
    try {
      const tags = await this.getTagsForMedia(mediaId);
      return tags.some(tag => tag.tagId === tagId);
    } catch (error) {
      console.error('Error verificando etiqueta:', error);
      return false;
    }
  }

  /**
   * Alternar una etiqueta en un medio (asignar si no existe, desasignar si existe)
   */
  async toggleTagForMedia(mediaId: string, tagId: number): Promise<'assigned' | 'unassigned' | 'error'> {
    try {
      const hasTag = await this.hasTag(mediaId, tagId);
      
      if (hasTag) {
        const success = await this.unassignTagFromMedia(mediaId, tagId);
        return success ? 'unassigned' : 'error';
      } else {
        const success = await this.assignTagToMedia(mediaId, tagId);
        return success ? 'assigned' : 'error';
      }

    } catch (error) {
      console.error('Error alternando etiqueta:', error);
      return 'error';
    }
  }

  // ===================== CONSULTAS Y FILTROS ======================

  /**
   * Buscar etiquetas por nombre
   */
  async searchTagsByName(searchTerm: string): Promise<Tag[]> {
    try {
      const allTags = await this.getAllTags();
      const term = searchTerm.toLowerCase();
      
      return allTags.filter(tag => 
        tag.nombre.toLowerCase().includes(term) ||
        (tag.descripcion && tag.descripcion.toLowerCase().includes(term))
      );

    } catch (error) {
      console.error('Error buscando etiquetas:', error);
      return [];
    }
  }

  /**
   * Obtener etiquetas más utilizadas
   */
  async getMostUsedTags(limit: number = 10): Promise<Array<Tag & { usageCount: number }>> {
    try {
      const allTags = await this.getAllTags();
      const tagsWithUsage = await Promise.all(
        allTags.map(async (tag) => {
          const mediaIds = await this.getMediaForTag(tag.tagId);
          return {
            ...tag,
            usageCount: mediaIds.length
          };
        })
      );

      return tagsWithUsage
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, limit);

    } catch (error) {
      console.error('Error obteniendo etiquetas más usadas:', error);
      return [];
    }
  }

  /**
   * Obtener etiquetas sin usar
   */
  async getUnusedTags(): Promise<Tag[]> {
    try {
      const allTags = await this.getAllTags();
      const unusedTags: Tag[] = [];

      for (const tag of allTags) {
        const mediaIds = await this.getMediaForTag(tag.tagId);
        if (mediaIds.length === 0) {
          unusedTags.push(tag);
        }
      }

      return unusedTags;

    } catch (error) {
      console.error('Error obteniendo etiquetas sin usar:', error);
      return [];
    }
  }

  // ===================== ETIQUETAS PREDETERMINADAS ======================

  /**
   * Crear etiquetas predeterminadas del sistema
   */
  async createDefaultTags(): Promise<void> {
    const defaultTags: CreateTagDto[] = [
      {
        nombre: 'Personal',
        color: '#3880ff',
        descripcion: 'Fotos personales y familiares',
        esEtiquetaSistema: true
      },
      {
        nombre: 'Trabajo',
        color: '#10dc60',
        descripcion: 'Documentos y fotos relacionadas con el trabajo',
        esEtiquetaSistema: true
      },
      {
        nombre: 'Diversión',
        color: '#ffce00',
        descripcion: 'Actividades de ocio y entretenimiento',
        esEtiquetaSistema: true
      },
      {
        nombre: 'Viajes',
        color: '#f04141',
        descripcion: 'Fotos de viajes y vacaciones',
        esEtiquetaSistema: true
      },
      {
        nombre: 'Comida',
        color: '#7044ff',
        descripcion: 'Fotos de comida y restaurantes',
        esEtiquetaSistema: true
      }
    ];

    for (const tagData of defaultTags) {
      try {
        await this.createTag(tagData);
      } catch (error) {
        // Ignorar errores si la etiqueta ya existe
        console.log(`Etiqueta "${tagData.nombre}" ya existe o hubo un error:`, error);
      }
    }
  }

  // ===================== UTILIDADES ======================

  /**
   * Cargar etiquetas y actualizar el BehaviorSubject
   */
  private async loadTags(): Promise<void> {
    try {
      const tags = await this.storageService.getAllTags();
      this.tagsSubject.next(tags);
    } catch (error) {
      console.error('Error cargando etiquetas:', error);
    }
  }

  /**
   * Obtener estadísticas de etiquetas
   */
  async getTagStatistics(): Promise<{
    totalTags: number;
    totalAssociations: number;
    averageTagsPerMedia: number;
    mostUsedTag: Tag | null;
  }> {
    try {
      const stats = await this.storageService.getStorageStats();
      const allTags = await this.getAllTags();
      
      let mostUsedTag: Tag | null = null;
      let maxUsage = 0;

      for (const tag of allTags) {
        const mediaIds = await this.getMediaForTag(tag.tagId);
        if (mediaIds.length > maxUsage) {
          maxUsage = mediaIds.length;
          mostUsedTag = tag;
        }
      }

      const averageTagsPerMedia = stats.uniqueMediaCount > 0 
        ? stats.totalAssociations / stats.uniqueMediaCount 
        : 0;

      return {
        totalTags: stats.totalTags,
        totalAssociations: stats.totalAssociations,
        averageTagsPerMedia: Math.round(averageTagsPerMedia * 100) / 100,
        mostUsedTag
      };

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        totalTags: 0,
        totalAssociations: 0,
        averageTagsPerMedia: 0,
        mostUsedTag: null
      };
    }
  }

  /**
   * Limpiar todas las etiquetas (útil para testing)
   */
  async clearAllTags(): Promise<void> {
    try {
      await this.storageService.clearAllData();
      await this.loadTags();
    } catch (error) {
      console.error('Error limpiando etiquetas:', error);
    }
  }

  /**
   * Exportar etiquetas como JSON
   */
  async exportTags(): Promise<string> {
    try {
      const tags = await this.getAllTags();
      return JSON.stringify(tags, null, 2);
    } catch (error) {
      console.error('Error exportando etiquetas:', error);
      return '[]';
    }
  }

  /**
   * Importar etiquetas desde JSON
   */
  async importTags(jsonData: string): Promise<number> {
    try {
      const tags: Tag[] = JSON.parse(jsonData);
      let importedCount = 0;

      for (const tag of tags) {
        try {
          const createDto: CreateTagDto = {
            nombre: tag.nombre,
            color: tag.color,
            descripcion: tag.descripcion,
            esEtiquetaSistema: tag.esEtiquetaSistema
          };
          
          await this.createTag(createDto);
          importedCount++;
        } catch (error) {
          console.warn(`No se pudo importar la etiqueta "${tag.nombre}":`, error);
        }
      }

      return importedCount;
    } catch (error) {
      console.error('Error importando etiquetas:', error);
      return 0;
    }
  }
}
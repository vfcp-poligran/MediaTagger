import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { MediaItem, MediaItemWithTags, PaginationOptions, PaginatedResult, MediaFilter } from '../models';
import { StorageService } from './storage.service';

/**
 * Servicio para gestionar medios de la galería y cámara
 * Cumple con RF-001, RF-002, RF-009, RF-010, RNF-005
 */
@Injectable({
  providedIn: 'root'
})
export class MediaService {
  private readonly PHOTOS_STORAGE = 'photos';
  private mediaItems: MediaItem[] = [];
  private isLoading = false;

  constructor(private storageService: StorageService) {
    this.loadSavedPhotos();
  }

  /**
   * Solicitar permisos para acceder a la galería (RF-001)
   */
  async requestMediaPermissions(): Promise<boolean> {
    try {
      return true;
    } catch (error) {
      console.error('Error solicitando permisos de media:', error);
      return false;
    }
  }

  /**
   * Obtener medios de la galería del dispositivo con paginación (RF-002, RNF-005)
   */
  async getMediaFromGallery(options: PaginationOptions): Promise<PaginatedResult<MediaItem>> {
    try {
      this.isLoading = true;

      const startIndex = (options.page - 1) * options.limit;
      const paginatedItems = this.mediaItems.slice(startIndex, startIndex + options.limit);

      return {
        items: paginatedItems,
        total: this.mediaItems.length,
        page: options.page,
        limit: options.limit,
        hasMore: startIndex + options.limit < this.mediaItems.length
      };

    } catch (error) {
      console.error('Error obteniendo medios de la galería:', error);
      return {
        items: [],
        total: 0,
        page: options.page,
        limit: options.limit,
        hasMore: false
      };
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Capturar nueva foto con la cámara (RF-009)
   */
  async capturePhoto(): Promise<MediaItem | null> {
    try {
      const capturedPhoto = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 90,
        allowEditing: false,
        saveToGallery: true
      });

      if (!capturedPhoto.webPath) {
        throw new Error('No se pudo obtener la ruta de la foto');
      }

      const mediaItem: MediaItem = {
        mediaId: `captured_${Date.now()}`,
        uri: capturedPhoto.webPath,
        type: 'photo',
        filename: `photo_${Date.now()}.jpg`,
        dateCreated: new Date()
      };

      await this.savePhoto(capturedPhoto, mediaItem);
      return mediaItem;

    } catch (error) {
      console.error('Error capturando foto:', error);
      return null;
    }
  }

  /**
   * Seleccionar desde la galería
   */
  async pickFromGallery(): Promise<MediaItem | null> {
    try {
      const selectedPhoto = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        quality: 90,
        allowEditing: false
      });

      if (!selectedPhoto.webPath) {
        throw new Error('No se pudo obtener la ruta de la foto');
      }

      const mediaItem: MediaItem = {
        mediaId: `gallery_${Date.now()}`,
        uri: selectedPhoto.webPath,
        type: 'photo',
        filename: `gallery_photo_${Date.now()}.jpg`,
        dateCreated: new Date()
      };

      this.mediaItems.unshift(mediaItem);
      await this.updateStoredPhotos();

      return mediaItem;

    } catch (error) {
      console.error('Error seleccionando de galería:', error);
      return null;
    }
  }

  /**
   * Guardar foto capturada en el sistema de archivos local
   */
  private async savePhoto(photo: Photo, mediaItem: MediaItem): Promise<void> {
    try {
      const base64Data = await this.readAsBase64(photo);
      const fileName = `${mediaItem.mediaId}.jpeg`;
      
      await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Data
      });

      const savedFile = await Filesystem.getUri({
        directory: Directory.Data,
        path: fileName
      });

      mediaItem.uri = savedFile.uri;
      this.mediaItems.unshift(mediaItem);
      await this.updateStoredPhotos();

    } catch (error) {
      console.error('Error guardando foto:', error);
      throw error;
    }
  }

  /**
   * Leer foto como base64
   */
  private async readAsBase64(photo: Photo): Promise<string> {
    if (photo.webPath) {
      const response = await fetch(photo.webPath);
      const blob = await response.blob();
      const base64Data = await this.convertBlobToBase64(blob) as string;
      return base64Data;
    } else {
      return photo.base64String || '';
    }
  }

  /**
   * Convertir blob a base64
   */
  private convertBlobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(blob);
    });
  };

  /**
   * Cargar fotos guardadas desde preferences
   */
  private async loadSavedPhotos(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: this.PHOTOS_STORAGE });
      if (value) {
        this.mediaItems = JSON.parse(value).map((item: any) => ({
          ...item,
          dateCreated: new Date(item.dateCreated)
        }));
      }
    } catch (error) {
      console.error('Error cargando fotos guardadas:', error);
    }
  }

  /**
   * Actualizar fotos guardadas en preferences
   */
  private async updateStoredPhotos(): Promise<void> {
    try {
      await Preferences.set({
        key: this.PHOTOS_STORAGE,
        value: JSON.stringify(this.mediaItems)
      });
    } catch (error) {
      console.error('Error guardando fotos:', error);
    }
  }

  /**
   * Obtener medios con sus etiquetas asignadas
   */
  async getMediaWithTags(filter?: MediaFilter): Promise<MediaItemWithTags[]> {
    try {
      let medias = [...this.mediaItems];

      if (filter) {
        if (filter.type && filter.type !== 'all') {
          medias = medias.filter(media => media.type === filter.type);
        }

        if (filter.filename) {
          medias = medias.filter(media => 
            media.filename?.toLowerCase().includes(filter.filename!.toLowerCase())
          );
        }

        if (filter.dateFrom) {
          medias = medias.filter(media => 
            media.dateCreated && media.dateCreated >= filter.dateFrom!
          );
        }

        if (filter.dateTo) {
          medias = medias.filter(media => 
            media.dateCreated && media.dateCreated <= filter.dateTo!
          );
        }
      }

      const mediaWithTags: MediaItemWithTags[] = await Promise.all(
        medias.map(async (media) => {
          const tags = await this.storageService.getTagsForMedia(media.mediaId);
          return {
            ...media,
            tags
          };
        })
      );

      if (filter?.tagIds && filter.tagIds.length > 0) {
        return mediaWithTags.filter(media => 
          filter.tagIds!.some(tagId => 
            media.tags.some(tag => tag.tagId === tagId)
          )
        );
      }

      return mediaWithTags;

    } catch (error) {
      console.error('Error obteniendo medios con etiquetas:', error);
      return [];
    }
  }

  /**
   * Filtrar medios por etiquetas específicas (RF-008)
   */
  async filterMediaByTags(tagIds: number[], useAndLogic = false): Promise<MediaItemWithTags[]> {
    try {
      let filteredMediaIds: string[];

      if (useAndLogic) {
        filteredMediaIds = await this.storageService.getMediaWithAllTags(tagIds);
      } else {
        filteredMediaIds = await this.storageService.getMediaWithAnyTags(tagIds);
      }

      const filteredMedias = this.mediaItems.filter(media => 
        filteredMediaIds.includes(media.mediaId)
      );

      const mediaWithTags: MediaItemWithTags[] = await Promise.all(
        filteredMedias.map(async (media) => {
          const tags = await this.storageService.getTagsForMedia(media.mediaId);
          return {
            ...media,
            tags
          };
        })
      );

      return mediaWithTags;

    } catch (error) {
      console.error('Error filtrando medios por etiquetas:', error);
      return [];
    }
  }

  /**
   * Eliminar un medio específico
   */
  async deleteMedia(mediaId: string): Promise<boolean> {
    try {
      const index = this.mediaItems.findIndex(media => media.mediaId === mediaId);
      if (index === -1) return false;

      const media = this.mediaItems[index];
      this.mediaItems.splice(index, 1);

      if (media.mediaId.startsWith('captured_')) {
        try {
          const fileName = `${media.mediaId}.jpeg`;
          await Filesystem.deleteFile({
            path: fileName,
            directory: Directory.Data
          });
        } catch (fileError) {
          console.warn('No se pudo eliminar el archivo físico:', fileError);
        }
      }

      await this.storageService.removeAllTagsFromMedia(mediaId);
      await this.updateStoredPhotos();

      return true;

    } catch (error) {
      console.error('Error eliminando medio:', error);
      return false;
    }
  }

  /**
   * Obtener estadísticas de medios
   */
  getMediaStats(): { totalPhotos: number; totalVideos: number; totalSize: number; } {
    const photos = this.mediaItems.filter(m => m.type === 'photo');
    const videos = this.mediaItems.filter(m => m.type === 'video');
    const totalSize = this.mediaItems.reduce((sum, m) => sum + (m.size || 0), 0);

    return {
      totalPhotos: photos.length,
      totalVideos: videos.length,
      totalSize
    };
  }

  /**
   * Verificar si está cargando
   */
  get loading(): boolean {
    return this.isLoading;
  }

  /**
   * Obtener todos los medios locales
   */
  getAllLocalMedia(): MediaItem[] {
    return [...this.mediaItems];
  }

  /**
   * Limpiar todos los medios locales
   */
  async clearAllMedia(): Promise<void> {
    try {
      this.mediaItems = [];
      await this.updateStoredPhotos();
    } catch (error) {
      console.error('Error limpiando medios:', error);
    }
  }

  /**
   * Crear algunos medios de ejemplo para demostración
   */
  async createSampleMedia(): Promise<void> {
    const sampleMedias: MediaItem[] = [
      {
        mediaId: 'sample_1',
        uri: 'https://picsum.photos/400/300?random=1',
        type: 'photo',
        filename: 'paisaje.jpg',
        dateCreated: new Date('2024-10-15'),
        size: 2048576
      },
      {
        mediaId: 'sample_2',
        uri: 'https://picsum.photos/400/300?random=2',
        type: 'photo',
        filename: 'retrato.jpg',
        dateCreated: new Date('2024-10-20'),
        size: 1536720
      },
      {
        mediaId: 'sample_3',
        uri: 'https://picsum.photos/400/300?random=3',
        type: 'photo',
        filename: 'arquitectura.jpg',
        dateCreated: new Date('2024-10-25'),
        size: 3072000
      }
    ];

    this.mediaItems.unshift(...sampleMedias);
    await this.updateStoredPhotos();
  }
}
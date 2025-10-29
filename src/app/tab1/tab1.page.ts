import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ActionSheetController, AlertController, ModalController, LoadingController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { MediaService } from '../services/media.service';
import { TagService } from '../services/tag.service';
import { MediaItemWithTags, Tag, MediaFilter } from '../models';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class Tab1Page implements OnInit, OnDestroy {
  medias: MediaItemWithTags[] = [];
  filteredMedias: MediaItemWithTags[] = [];
  availableTags: Tag[] = [];
  selectedTags: number[] = [];
  isLoading = false;
  filterMode: 'all' | 'any' = 'any';
  mediaType: 'all' | 'photo' | 'video' = 'all';
  
  private subscriptions: Subscription[] = [];

  constructor(
    private mediaService: MediaService,
    private tagService: TagService,
    private actionSheetController: ActionSheetController,
    private alertController: AlertController,
    private modalController: ModalController,
    private loadingController: LoadingController
  ) {}

  async ngOnInit() {
    await this.initializeData();
    await this.loadMedias();
    await this.loadTags();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Inicializar datos de ejemplo y etiquetas predeterminadas
   */
  private async initializeData() {
    try {
      // Crear etiquetas predeterminadas si no existen
      await this.tagService.createDefaultTags();
      
      // Crear medios de ejemplo para demostración
      const existingMedias = this.mediaService.getAllLocalMedia();
      if (existingMedias.length === 0) {
        await this.mediaService.createSampleMedia();
      }
    } catch (error) {
      console.error('Error inicializando datos:', error);
    }
  }

  /**
   * Cargar medios con sus etiquetas
   */
  async loadMedias() {
    try {
      this.isLoading = true;
      
      const filter: MediaFilter = {
        type: this.mediaType,
        tagIds: this.selectedTags.length > 0 ? this.selectedTags : undefined
      };

      this.medias = await this.mediaService.getMediaWithTags(filter);
      this.filteredMedias = [...this.medias];
      
    } catch (error) {
      console.error('Error cargando medios:', error);
      this.medias = [];
      this.filteredMedias = [];
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Cargar etiquetas disponibles
   */
  async loadTags() {
    try {
      this.availableTags = await this.tagService.getAllTags();
    } catch (error) {
      console.error('Error cargando etiquetas:', error);
      this.availableTags = [];
    }
  }

  /**
   * Mostrar menú de filtros de etiquetas (RF-008)
   */
  async showFilterMenu() {
    try {
      const tagButtons = this.availableTags.map(tag => ({
        text: `${tag.nombre} ${this.selectedTags.includes(tag.tagId) ? '✓' : ''}`,
        handler: () => {
          this.toggleTagFilter(tag.tagId);
        },
        cssClass: this.selectedTags.includes(tag.tagId) ? 'selected-tag' : ''
      }));

      const actionSheet = await this.actionSheetController.create({
        header: 'Filtrar por Etiquetas',
        buttons: [
          ...tagButtons,
          {
            text: 'Limpiar Filtros',
            handler: () => {
              this.clearFilters();
            },
            cssClass: 'clear-filters'
          },
          {
            text: `Modo: ${this.filterMode === 'any' ? 'Cualquiera' : 'Todas'}`,
            handler: () => {
              this.toggleFilterMode();
            },
            cssClass: 'filter-mode'
          },
          {
            text: 'Cancelar',
            role: 'cancel'
          }
        ]
      });

      await actionSheet.present();
    } catch (error) {
      console.error('Error mostrando menú de filtros:', error);
    }
  }

  /**
   * Alternar filtro de etiqueta
   */
  toggleTagFilter(tagId: number) {
    const index = this.selectedTags.indexOf(tagId);
    if (index > -1) {
      this.selectedTags.splice(index, 1);
    } else {
      this.selectedTags.push(tagId);
    }
    this.applyFilters();
  }

  /**
   * Cambiar modo de filtro (AND/OR)
   */
  toggleFilterMode() {
    this.filterMode = this.filterMode === 'any' ? 'all' : 'any';
    this.applyFilters();
  }

  /**
   * Limpiar todos los filtros
   */
  clearFilters() {
    this.selectedTags = [];
    this.mediaType = 'all';
    this.applyFilters();
  }

  /**
   * Aplicar filtros a los medios
   */
  async applyFilters() {
    try {
      if (this.selectedTags.length === 0) {
        // Sin filtros de etiquetas, mostrar todos
        await this.loadMedias();
      } else {
        // Aplicar filtros de etiquetas
        this.isLoading = true;
        const useAndLogic = this.filterMode === 'all';
        this.filteredMedias = await this.mediaService.filterMediaByTags(this.selectedTags, useAndLogic);
        
        // Aplicar filtro de tipo de medio
        if (this.mediaType !== 'all') {
          this.filteredMedias = this.filteredMedias.filter(media => media.type === this.mediaType);
        }
      }
    } catch (error) {
      console.error('Error aplicando filtros:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Mostrar menú de opciones de cámara (RF-009, RF-010)
   */
  async showCameraOptions() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Agregar Foto',
      buttons: [
        {
          text: 'Tomar Foto',
          icon: 'camera',
          handler: () => {
            this.capturePhoto();
          }
        },
        {
          text: 'Seleccionar de Galería',
          icon: 'images',
          handler: () => {
            this.pickFromGallery();
          }
        },
        {
          text: 'Cancelar',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  /**
   * Capturar foto con la cámara (RF-009, RF-010)
   */
  async capturePhoto() {
    try {
      const loading = await this.loadingController.create({
        message: 'Capturando foto...'
      });
      await loading.present();

      const mediaItem = await this.mediaService.capturePhoto();
      await loading.dismiss();

      if (mediaItem) {
        await this.loadMedias();
        this.showSuccessMessage('Foto capturada exitosamente');
      } else {
        this.showErrorMessage('No se pudo capturar la foto');
      }
    } catch (error) {
      console.error('Error capturando foto:', error);
      this.showErrorMessage('Error al acceder a la cámara');
    }
  }

  /**
   * Seleccionar foto de la galería
   */
  async pickFromGallery() {
    try {
      const loading = await this.loadingController.create({
        message: 'Seleccionando foto...'
      });
      await loading.present();

      const mediaItem = await this.mediaService.pickFromGallery();
      await loading.dismiss();

      if (mediaItem) {
        await this.loadMedias();
        this.showSuccessMessage('Foto agregada exitosamente');
      } else {
        this.showErrorMessage('No se pudo agregar la foto');
      }
    } catch (error) {
      console.error('Error seleccionando foto:', error);
      this.showErrorMessage('Error al acceder a la galería');
    }
  }

  /**
   * Abrir modal de detalles del medio (RF-006, RF-007)
   */
  async openMediaDetail(media: MediaItemWithTags) {
    try {
      // Por ahora mostraremos un ActionSheet con opciones
      // Más adelante se implementará el modal completo
      await this.showMediaOptions(media);
    } catch (error) {
      console.error('Error abriendo detalles del medio:', error);
    }
  }

  /**
   * Mostrar opciones para un medio específico
   */
  async showMediaOptions(media: MediaItemWithTags) {
    const actionSheet = await this.actionSheetController.create({
      header: media.filename || 'Opciones del Medio',
      buttons: [
        {
          text: 'Gestionar Etiquetas',
          icon: 'pricetag',
          handler: () => {
            this.manageMediaTags(media);
          }
        },
        {
          text: 'Ver Información',
          icon: 'information-circle',
          handler: () => {
            this.showMediaInfo(media);
          }
        },
        {
          text: 'Eliminar',
          icon: 'trash',
          handler: () => {
            this.confirmDeleteMedia(media);
          },
          cssClass: 'danger-option'
        },
        {
          text: 'Cancelar',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  /**
   * Gestionar etiquetas de un medio específico (RF-006, RF-007)
   */
  async manageMediaTags(media: MediaItemWithTags) {
    try {
      const tagButtons = this.availableTags.map(tag => {
        const isAssigned = media.tags.some(mediaTag => mediaTag.tagId === tag.tagId);
        return {
          text: `${tag.nombre} ${isAssigned ? '✓' : ''}`,
          handler: async () => {
            await this.toggleMediaTag(media.mediaId, tag.tagId);
          },
          cssClass: isAssigned ? 'assigned-tag' : ''
        };
      });

      const actionSheet = await this.actionSheetController.create({
        header: `Etiquetas: ${media.filename}`,
        buttons: [
          ...tagButtons,
          {
            text: 'Crear Nueva Etiqueta',
            icon: 'add',
            handler: () => {
              this.createNewTag();
            }
          },
          {
            text: 'Cancelar',
            role: 'cancel'
          }
        ]
      });

      await actionSheet.present();
    } catch (error) {
      console.error('Error gestionando etiquetas:', error);
    }
  }

  /**
   * Alternar etiqueta para un medio (asignar/desasignar)
   */
  async toggleMediaTag(mediaId: string, tagId: number) {
    try {
      const result = await this.tagService.toggleTagForMedia(mediaId, tagId);
      
      if (result === 'assigned') {
        this.showSuccessMessage('Etiqueta asignada');
      } else if (result === 'unassigned') {
        this.showSuccessMessage('Etiqueta removida');
      } else {
        this.showErrorMessage('Error al gestionar etiqueta');
      }

      await this.loadMedias();
    } catch (error) {
      console.error('Error alternando etiqueta:', error);
      this.showErrorMessage('Error al gestionar etiqueta');
    }
  }

  /**
   * Crear nueva etiqueta
   */
  async createNewTag() {
    const alert = await this.alertController.create({
      header: 'Nueva Etiqueta',
      inputs: [
        {
          name: 'nombre',
          type: 'text',
          placeholder: 'Nombre de la etiqueta'
        },
        {
          name: 'descripcion',
          type: 'textarea',
          placeholder: 'Descripción (opcional)'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Crear',
          handler: async (data) => {
            if (data.nombre && data.nombre.trim()) {
              const tag = await this.tagService.createTag({
                nombre: data.nombre.trim(),
                descripcion: data.descripcion?.trim()
              });
              
              if (tag) {
                await this.loadTags();
                this.showSuccessMessage('Etiqueta creada exitosamente');
              } else {
                this.showErrorMessage('Error al crear etiqueta');
              }
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Mostrar información detallada del medio
   */
  async showMediaInfo(media: MediaItemWithTags) {
    const tagsText = media.tags.length > 0 
      ? media.tags.map(tag => tag.nombre).join(', ')
      : 'Sin etiquetas';

    const alert = await this.alertController.create({
      header: 'Información del Medio',
      message: `
        <strong>Nombre:</strong> ${media.filename || 'Sin nombre'}<br>
        <strong>Tipo:</strong> ${media.type === 'photo' ? 'Foto' : 'Video'}<br>
        <strong>Fecha:</strong> ${media.dateCreated?.toLocaleDateString() || 'Desconocida'}<br>
        <strong>Tamaño:</strong> ${media.size ? this.formatFileSize(media.size) : 'Desconocido'}<br>
        <strong>Etiquetas:</strong> ${tagsText}
      `,
      buttons: ['OK']
    });

    await alert.present();
  }

  /**
   * Confirmar eliminación de medio
   */
  async confirmDeleteMedia(media: MediaItemWithTags) {
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `¿Estás seguro de que quieres eliminar "${media.filename}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          handler: async () => {
            const success = await this.mediaService.deleteMedia(media.mediaId);
            if (success) {
              await this.loadMedias();
              this.showSuccessMessage('Medio eliminado exitosamente');
            } else {
              this.showErrorMessage('Error al eliminar medio');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Refrescar datos
   */
  async refreshData(event: any) {
    try {
      await this.loadMedias();
      await this.loadTags();
    } catch (error) {
      console.error('Error refrescando datos:', error);
    } finally {
      event.target.complete();
    }
  }

  /**
   * Formatear tamaño de archivo
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Mostrar mensaje de éxito
   */
  private async showSuccessMessage(message: string) {
    const alert = await this.alertController.create({
      header: 'Éxito',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  /**
   * Mostrar mensaje de error
   */
  private async showErrorMessage(message: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  /**
   * Obtener texto del filtro actual
   */
  get filterText(): string {
    if (this.selectedTags.length === 0) return 'Todos';
    
    const tagNames = this.selectedTags
      .map(tagId => {
        const tag = this.availableTags.find(t => t.tagId === tagId);
        return tag?.nombre || '';
      })
      .filter(name => name);
    
    const modeText = this.filterMode === 'any' ? 'cualquiera' : 'todas';
    return `${tagNames.join(', ')} (${modeText})`;
  }

  /**
   * Verificar si hay filtros activos
   */
  get hasActiveFilters(): boolean {
    return this.selectedTags.length > 0 || this.mediaType !== 'all';
  }

  /**
   * TrackBy function para optimizar el rendering de la lista
   */
  trackByMediaId(index: number, media: MediaItemWithTags): string {
    return media.mediaId;
  }
}

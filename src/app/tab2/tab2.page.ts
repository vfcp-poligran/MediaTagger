import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { PhotoService } from '../services/photo.service';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

interface TagInfo {
  name: string;
  count: number;
}

interface Stats {
  totalPhotos: number;
  totalTags: number;
  avgTagsPerPhoto: number;
  mostUsedTag?: TagInfo;
}

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [CommonModule, IonicModule]
})
export class Tab2Page implements OnInit {
  tags: TagInfo[] = [];
  stats: Stats = {
    totalPhotos: 0,
    totalTags: 0,
    avgTagsPerPhoto: 0
  };

  private tagColors = ['primary', 'secondary', 'tertiary', 'success', 'warning', 'danger'];

  constructor(
    private photoService: PhotoService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadTags();
  }

  ionViewWillEnter() {
    // Recargar datos cada vez que se entra a la página
    this.loadTags();
  }

  loadTags() {
    this.tags = this.photoService.getAllTags();
    this.calculateStats();
  }

  private calculateStats() {
    const photos = this.photoService.photos;
    this.stats.totalPhotos = photos.length;
    this.stats.totalTags = this.tags.length;

    if (photos.length > 0) {
      const totalTagsUsed = photos.reduce((sum, photo) => sum + photo.tags.length, 0);
      this.stats.avgTagsPerPhoto = totalTagsUsed / photos.length;
      
      this.stats.mostUsedTag = this.tags.length > 0 
        ? this.tags.reduce((max, tag) => tag.count > max.count ? tag : max)
        : undefined;
    } else {
      this.stats.avgTagsPerPhoto = 0;
      this.stats.mostUsedTag = undefined;
    }
  }

  trackByTagName(index: number, tag: TagInfo): string {
    return tag.name;
  }

  getTagColor(tagName: string): string {
    // Generar un color consistente basado en el nombre de la etiqueta
    const hash = this.hashCode(tagName);
    const colorIndex = Math.abs(hash) % this.tagColors.length;
    return this.tagColors[colorIndex];
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  async filterByTag(tagName: string) {
    // Navegar a la galería con filtro aplicado
    this.router.navigate(['/tabs/tab1'], { 
      queryParams: { filter: tagName }
    });
    
    // Mostrar toast informativo
    const toast = await this.toastController.create({
      message: `Mostrando fotos con etiqueta "${tagName}"`,
      duration: 2000,
      position: 'bottom',
      color: 'primary'
    });
    
    await toast.present();
  }

  async addNewTag() {
    const alert = await this.alertController.create({
      header: 'Nueva Etiqueta',
      message: 'Ingresa el nombre de la nueva etiqueta',
      inputs: [
        {
          name: 'tagName',
          type: 'text',
          placeholder: 'Nombre de la etiqueta',
          attributes: {
            maxlength: 20
          }
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
            const tagName = data.tagName?.trim();
            if (tagName) {
              if (this.tags.some(tag => tag.name.toLowerCase() === tagName.toLowerCase())) {
                this.showToast('Esta etiqueta ya existe', 'warning');
                return false;
              }
              
              // La etiqueta se creará cuando se use en una foto
              this.showToast(`Etiqueta "${tagName}" lista para usar`, 'success');
              return true;
            } else {
              this.showToast('Por favor ingresa un nombre válido', 'danger');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async editTag(tag: TagInfo, event: Event) {
    event.stopPropagation(); // Evitar que se active el click del item
    
    const actionSheet = await this.alertController.create({
      header: `Editar "${tag.name}"`,
      message: `Esta etiqueta se usa en ${tag.count} ${tag.count === 1 ? 'foto' : 'fotos'}`,
      buttons: [
        {
          text: 'Renombrar etiqueta',
          handler: () => {
            this.renameTag(tag);
          }
        },
        {
          text: 'Eliminar de todas las fotos',
          role: 'destructive',
          handler: () => {
            this.confirmDeleteTag(tag);
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

  private async renameTag(tag: TagInfo) {
    const alert = await this.alertController.create({
      header: 'Renombrar Etiqueta',
      message: `Cambiar "${tag.name}" por:`,
      inputs: [
        {
          name: 'newTagName',
          type: 'text',
          placeholder: 'Nuevo nombre',
          value: tag.name,
          attributes: {
            maxlength: 20
          }
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Renombrar',
          handler: async (data) => {
            const newName = data.newTagName?.trim();
            if (newName && newName !== tag.name) {
              if (this.tags.some(t => t.name.toLowerCase() === newName.toLowerCase())) {
                this.showToast('Ya existe una etiqueta con ese nombre', 'warning');
                return false;
              }
              
              await this.performTagRename(tag.name, newName);
              return true;
            }
            return false;
          }
        }
      ]
    });

    await alert.present();
  }

  private async performTagRename(oldName: string, newName: string) {
    const photos = this.photoService.photos;
    let updatedCount = 0;

    for (const photo of photos) {
      if (photo.tags.includes(oldName)) {
        const newTags = photo.tags.map(tag => tag === oldName ? newName : tag);
        await this.photoService.updatePhotoTags(photo, newTags);
        updatedCount++;
      }
    }

    this.loadTags();
    this.showToast(`Etiqueta renombrada en ${updatedCount} ${updatedCount === 1 ? 'foto' : 'fotos'}`, 'success');
  }

  private async confirmDeleteTag(tag: TagInfo) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar la etiqueta "${tag.name}" de todas las fotos?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.performTagDeletion(tag.name);
          }
        }
      ]
    });

    await alert.present();
  }

  private async performTagDeletion(tagName: string) {
    const photos = this.photoService.photos;
    let updatedCount = 0;

    for (const photo of photos) {
      if (photo.tags.includes(tagName)) {
        const newTags = photo.tags.filter(tag => tag !== tagName);
        await this.photoService.updatePhotoTags(photo, newTags);
        updatedCount++;
      }
    }

    this.loadTags();
    this.showToast(`Etiqueta eliminada de ${updatedCount} ${updatedCount === 1 ? 'foto' : 'fotos'}`, 'success');
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color
    });
    
    await toast.present();
  }
}

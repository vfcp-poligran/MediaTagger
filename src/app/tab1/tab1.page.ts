import { Component, OnInit } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { AlertController, ActionSheetController } from '@ionic/angular';
import { PhotoService, UserPhoto } from '../services/photo.service';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [CommonModule, IonicModule]
})
export class Tab1Page implements OnInit {
  photos: UserPhoto[] = [];

  constructor(
    private photoService: PhotoService,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController
  ) {}

  ngOnInit() {
    this.loadPhotos();
  }

  async loadPhotos() {
    this.photos = await this.photoService.loadSaved();
  }

  async capturePhoto() {
    try {
      // Capturar foto usando la cámara
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 90
      });

      // Mostrar diálogo para agregar etiquetas
      const alert = await this.alertController.create({
        header: 'Nueva Foto',
        message: 'Agrega un título y etiquetas para tu foto',
        inputs: [
          {
            name: 'title',
            type: 'text',
            placeholder: 'Título de la foto',
            value: `Foto ${new Date().toLocaleDateString()}`
          },
          {
            name: 'tags',
            type: 'text',
            placeholder: 'Etiquetas (separadas por comas)',
            value: ''
          }
        ],
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Guardar',
            handler: async (data) => {
              const title = data.title || `Foto ${new Date().toLocaleDateString()}`;
              const tags = data.tags ? data.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0) : [];
              
              await this.photoService.addNewToGallery(photo, title, tags);
              await this.loadPhotos();
            }
          }
        ]
      });

      await alert.present();
    } catch (error) {
      console.error('Error al capturar la foto:', error);
      
      const errorAlert = await this.alertController.create({
        header: 'Error',
        message: 'No se pudo capturar la foto. Verifica los permisos de la cámara.',
        buttons: ['OK']
      });
      
      await errorAlert.present();
    }
  }

  async openFilterMenu() {
    const tags = this.photoService.getAllTags();
    
    const actionSheet = await this.actionSheetController.create({
      header: 'Filtrar por etiqueta',
      buttons: [
        {
          text: 'Mostrar todas',
          icon: 'grid-outline',
          handler: () => {
            this.loadPhotos();
          }
        },
        ...tags.map(tag => ({
          text: `${tag.name} (${tag.count})`,
          icon: 'pricetag-outline',
          handler: () => {
            this.photos = this.photoService.getPhotosByTag(tag.name);
          }
        })),
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  async openPhotoDetail(photo: UserPhoto) {
    const actionSheet = await this.actionSheetController.create({
      header: photo.title,
      subHeader: `Creada: ${photo.date.toLocaleDateString()}`,
      buttons: [
        {
          text: 'Editar etiquetas',
          icon: 'create-outline',
          handler: () => {
            this.editPhotoTags(photo);
          }
        },
        {
          text: 'Eliminar foto',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => {
            this.confirmDeletePhoto(photo);
          }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  async editPhotoTags(photo: UserPhoto) {
    const alert = await this.alertController.create({
      header: 'Editar Etiquetas',
      message: `Foto: ${photo.title}`,
      inputs: [
        {
          name: 'tags',
          type: 'text',
          placeholder: 'Etiquetas (separadas por comas)',
          value: photo.tags.join(', ')
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Guardar',
          handler: async (data) => {
            const newTags = data.tags ? data.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0) : [];
            await this.photoService.updatePhotoTags(photo, newTags);
            await this.loadPhotos();
          }
        }
      ]
    });

    await alert.present();
  }

  async confirmDeletePhoto(photo: UserPhoto) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar "${photo.title}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.photoService.deletePhoto(photo);
            await this.loadPhotos();
          }
        }
      ]
    });

    await alert.present();
  }
}

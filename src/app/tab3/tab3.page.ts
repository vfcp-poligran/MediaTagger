import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { PhotoService } from '../services/photo.service';
import { Device } from '@capacitor/device';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

interface Feature {
  icon: string;
  title: string;
  description: string;
  color: string;
}

interface Technology {
  name: string;
  icon: string;
  color: string;
}

interface DeviceInfo {
  platform?: string;
  model?: string;
}

interface Stats {
  totalPhotos: number;
  totalTags: number;
}

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  imports: [CommonModule, IonicModule]
})
export class Tab3Page implements OnInit {
  appVersion = '1.0.0';
  deviceInfo: DeviceInfo = {};
  stats: Stats = {
    totalPhotos: 0,
    totalTags: 0
  };

  features: Feature[] = [
    {
      icon: 'camera-outline',
      title: 'Captura de Fotos',
      description: 'Toma fotos directamente desde la aplicación con acceso completo a la cámara',
      color: 'primary'
    },
    {
      icon: 'pricetags-outline',
      title: 'Sistema de Etiquetas',
      description: 'Organiza tus fotos con etiquetas personalizadas para encontrarlas fácilmente',
      color: 'secondary'
    },
    {
      icon: 'search-outline',
      title: 'Búsqueda Inteligente',
      description: 'Filtra y encuentra fotos rápidamente usando el sistema de etiquetas',
      color: 'tertiary'
    },
    {
      icon: 'cloud-offline-outline',
      title: 'Almacenamiento Local',
      description: 'Todas tus fotos se guardan de forma segura en tu dispositivo',
      color: 'success'
    },
    {
      icon: 'create-outline',
      title: 'Edición de Etiquetas',
      description: 'Modifica, renombra o elimina etiquetas en cualquier momento',
      color: 'warning'
    },
    {
      icon: 'phone-portrait-outline',
      title: 'Diseño Responsivo',
      description: 'Interfaz optimizada para diferentes tamaños de pantalla',
      color: 'danger'
    }
  ];

  technologies: Technology[] = [
    {
      name: 'Ionic 7',
      icon: 'logo-ionic',
      color: 'primary'
    },
    {
      name: 'Angular 17',
      icon: 'logo-angular',
      color: 'danger'
    },
    {
      name: 'Capacitor 5',
      icon: 'hardware-chip-outline',
      color: 'secondary'
    },
    {
      name: 'TypeScript',
      icon: 'logo-javascript',
      color: 'warning'
    },
    {
      name: 'SCSS',
      icon: 'color-palette-outline',
      color: 'tertiary'
    },
    {
      name: 'Responsive',
      icon: 'phone-portrait-outline',
      color: 'success'
    }
  ];

  constructor(
    private photoService: PhotoService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.loadDeviceInfo();
    this.loadStats();
  }

  ionViewWillEnter() {
    // Actualizar estadísticas cada vez que se entra a la página
    this.loadStats();
  }

  private async loadDeviceInfo() {
    try {
      const info = await Device.getInfo();
      this.deviceInfo = {
        platform: info.platform,
        model: info.model
      };
    } catch (error) {
      console.log('Device info not available in web environment');
      this.deviceInfo = {
        platform: 'Web',
        model: 'Navegador Web'
      };
    }
  }

  private loadStats() {
    const photos = this.photoService.photos;
    const tags = this.photoService.getAllTags();
    
    this.stats = {
      totalPhotos: photos.length,
      totalTags: tags.length
    };
  }

  async openPrivacyInfo() {
    const alert = await this.alertController.create({
      header: 'Privacidad y Datos',
      message: `
        <strong>Política de Privacidad:</strong><br><br>
        • Todas tus fotos se almacenan localmente en tu dispositivo<br>
        • No enviamos ningún dato a servidores externos<br>
        • Las etiquetas y metadatos se guardan en el almacenamiento local<br>
        • Tienes control total sobre tus datos<br>
        • Puedes eliminar todos los datos en cualquier momento<br><br>
        <strong>Permisos utilizados:</strong><br>
        • Cámara: Para capturar nuevas fotos<br>
        • Almacenamiento: Para guardar fotos y datos de la aplicación
      `,
      buttons: [
        {
          text: 'Entendido',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  async openHelp() {
    const alert = await this.alertController.create({
      header: 'Ayuda y Soporte',
      message: `
        <strong>¿Cómo usar MediaTagger?</strong><br><br>
        
        <strong>📸 Capturar fotos:</strong><br>
        • Toca el botón de cámara en la galería<br>
        • Agrega un título y etiquetas<br><br>
        
        <strong>🏷️ Gestionar etiquetas:</strong><br>
        • Ve a la pestaña "Etiquetas"<br>
        • Toca una etiqueta para filtrar fotos<br>
        • Usa el botón de edición para modificar etiquetas<br><br>
        
        <strong>🔍 Buscar fotos:</strong><br>
        • Usa el botón de filtro en la galería<br>
        • Selecciona una etiqueta para filtrar<br><br>
        
        <strong>✏️ Editar fotos:</strong><br>
        • Toca cualquier foto en la galería<br>
        • Selecciona "Editar etiquetas" o "Eliminar"
      `,
      buttons: [
        {
          text: 'Cerrar',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  async clearAllData() {
    const confirmAlert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `
        ⚠️ <strong>ADVERTENCIA</strong> ⚠️<br><br>
        Esta acción eliminará permanentemente:<br>
        • Todas las fotos (${this.stats.totalPhotos})<br>
        • Todas las etiquetas (${this.stats.totalTags})<br>
        • Todos los datos de la aplicación<br><br>
        <strong>Esta acción NO se puede deshacer.</strong>
      `,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar Todo',
          role: 'destructive',
          handler: async () => {
            await this.performDataClear();
          }
        }
      ]
    });

    await confirmAlert.present();
  }

  private async performDataClear() {
    try {
      // Eliminar todas las fotos
      const photos = [...this.photoService.photos]; // Crear copia para evitar problemas de iteración
      
      for (const photo of photos) {
        await this.photoService.deletePhoto(photo);
      }

      // Actualizar estadísticas
      this.loadStats();

      // Mostrar confirmación
      const successAlert = await this.alertController.create({
        header: 'Datos Eliminados',
        message: '✅ Todos los datos han sido eliminados exitosamente.',
        buttons: ['OK']
      });

      await successAlert.present();

    } catch (error) {
      console.error('Error al limpiar datos:', error);
      
      const errorAlert = await this.alertController.create({
        header: 'Error',
        message: '❌ Hubo un problema al eliminar los datos. Inténtalo nuevamente.',
        buttons: ['OK']
      });

      await errorAlert.present();
    }
  }
}

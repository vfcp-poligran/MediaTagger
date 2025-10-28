import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
  title: string;
  tags: string[];
  date: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  public photos: UserPhoto[] = [];
  private PHOTO_STORAGE = 'photos';
  private platform: Platform;

  constructor(platform: Platform) {
    this.platform = platform;
  }

  public async addNewToGallery(photo: Photo, title: string, tags: string[]) {
    // Guardar la foto en el sistema de archivos
    const savedImageFile = await this.savePicture(photo);

    // Agregar la nueva foto al inicio del array
    const newPhoto: UserPhoto = {
      filepath: savedImageFile.filepath,
      webviewPath: savedImageFile.webviewPath,
      title: title,
      tags: tags,
      date: new Date()
    };

    this.photos.unshift(newPhoto);

    // Guardar en Preferences
    await Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos)
    });
  }

  private async savePicture(photo: Photo) {
    // Convertir foto a base64
    const base64Data = await this.readAsBase64(photo);

    // Escribir el archivo en el directorio de datos
    const fileName = new Date().getTime() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    });

    if (this.platform.is('hybrid')) {
      // Mostrar la nueva imagen reescribiendo el 'file://' path a HTTP
      // Detalles: https://ionicframework.com/docs/building/webview#file-protocol
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri)
      };
    } else {
      // Usar webPath para mostrar la imagen en lugar de base64 
      // ya que ya está cargada en memoria
      return {
        filepath: fileName,
        webviewPath: photo.webPath
      };
    }
  }

  private async readAsBase64(photo: Photo) {
    // "hybrid" detectará Cordova o Capacitor
    if (this.platform.is('hybrid')) {
      // Leer el archivo en formato base64
      const file = await Filesystem.readFile({
        path: photo.path!
      });

      return file.data;
    } else {
      // Obtener la foto, leerla como blob y convertirla a formato base64
      const response = await fetch(photo.webPath!);
      const blob = await response.blob();

      return await this.convertBlobToBase64(blob) as string;
    }
  }

  private convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });

  public async loadSaved() {
    // Recuperar datos del array de fotos almacenado
    const { value } = await Preferences.get({ key: this.PHOTO_STORAGE });
    this.photos = (value ? JSON.parse(value) : []) as UserPhoto[];

    // Convertir las fechas de string a Date
    this.photos = this.photos.map(photo => ({
      ...photo,
      date: new Date(photo.date)
    }));

    // Mostrar las fotos leyendo el formato base64
    if (!this.platform.is('hybrid')) {
      for (let photo of this.photos) {
        // Leer cada foto guardada desde el sistema de archivos
        const readFile = await Filesystem.readFile({
          path: photo.filepath,
          directory: Directory.Data
        });

        // Solo plataforma web: Cargar la foto como datos base64
        photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
      }
    }

    return this.photos;
  }

  public async deletePhoto(photo: UserPhoto) {
    // Eliminar la foto del array
    this.photos = this.photos.filter(p => p.filepath !== photo.filepath);

    // Actualizar el array de fotos almacenado
    await Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos)
    });

    // Eliminar el archivo del sistema de archivos
    const filename = photo.filepath.substr(photo.filepath.lastIndexOf('/') + 1);
    await Filesystem.deleteFile({
      path: filename,
      directory: Directory.Data
    });
  }

  public async updatePhotoTags(photo: UserPhoto, newTags: string[]) {
    // Encontrar la foto en el array y actualizar sus etiquetas
    const photoIndex = this.photos.findIndex(p => p.filepath === photo.filepath);
    if (photoIndex !== -1) {
      this.photos[photoIndex].tags = newTags;
      
      // Guardar cambios en Preferences
      await Preferences.set({
        key: this.PHOTO_STORAGE,
        value: JSON.stringify(this.photos)
      });
    }
  }

  public getAllTags(): { name: string; count: number }[] {
    const tagCounts = new Map<string, number>();
    
    this.photos.forEach(photo => {
      photo.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCounts.entries()).map(([name, count]) => ({ name, count }));
  }

  public getPhotosByTag(tag: string): UserPhoto[] {
    return this.photos.filter(photo => photo.tags.includes(tag));
  }
}
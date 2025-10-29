# 📸 MediaTagger

Una aplicación móvil desarrollada con **Ionic Angular** para la gestión y etiquetado de fotografías, diseñada para facilitar la organización de imágenes con un sistema intuitivo de etiquetas y filtros.

## 🚀 Características

- **📱 Multiplataforma**: Compatible con iOS, Android y Web
- **📸 Captura de Fotos**: Integración nativa con la cámara del dispositivo
- **🏷️ Sistema de Etiquetas**: Asignación de múltiples etiquetas a cada fotografía
- **🔍 Filtros Avanzados**: Búsqueda y filtrado por etiquetas
- **📊 Estadísticas**: Visualización de métricas de la galería
- **💾 Almacenamiento Local**: Persistencia de datos sin necesidad de internet

## 🛠️ Tecnologías Utilizadas

- **[Ionic Framework](https://ionicframework.com/)** - Framework de desarrollo móvil
- **[Angular](https://angular.io/)** - Framework web con TypeScript
- **[Capacitor](https://capacitorjs.com/)** - Runtime nativo multiplataforma
- **[Capacitor Camera](https://capacitorjs.com/docs/apis/camera)** - Plugin para acceso a la cámara
- **[Capacitor Filesystem](https://capacitorjs.com/docs/apis/filesystem)** - Manejo del sistema de archivos
- **[Capacitor Preferences](https://capacitorjs.com/docs/apis/preferences)** - Almacenamiento de preferencias

## 📋 Requisitos Previos

- **Node.js** (versión 16 o superior)
- **npm** o **yarn**
- **Ionic CLI**: `npm install -g @ionic/cli`
- **Capacitor CLI**: `npm install -g @capacitor/cli`

### Para desarrollo móvil:
- **Android Studio** (para Android)
- **Xcode** (para iOS - solo en macOS)

## 🔧 Instalación

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/vfcp-poligran/MediaTagger.git
   cd MediaTagger
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Ejecutar en desarrollo web**:
   ```bash
   ionic serve
   ```
   La aplicación estará disponible en `http://localhost:8101`

## 📱 Desarrollo Móvil

### Android

1. **Construir la aplicación**:
   ```bash
   ionic build
   ionic cap add android
   ionic cap sync android
   ```

2. **Abrir en Android Studio**:
   ```bash
   ionic cap open android
   ```

3. **Ejecutar en dispositivo/emulador** desde Android Studio

### iOS

1. **Construir la aplicación**:
   ```bash
   ionic build
   ionic cap add ios
   ionic cap sync ios
   ```

2. **Abrir en Xcode**:
   ```bash
   ionic cap open ios
   ```

3. **Ejecutar en dispositivo/simulador** desde Xcode

## 🏗️ Estructura del Proyecto

```
src/
├── app/
│   ├── tab1/                 # Galería principal
│   ├── tab2/                 # Estadísticas
│   ├── tab3/                 # Búsqueda
│   ├── services/             # Servicios de la aplicación
│   │   └── photo.service.ts  # Servicio de gestión de fotos
│   ├── shared/               # Componentes compartidos
│   └── tabs/                 # Navegación por pestañas
├── assets/                   # Recursos estáticos
├── environments/             # Configuración de entornos
└── theme/                    # Estilos globales
```

## 🔌 APIs y Plugins

### Capacitor Plugins Utilizados

- **@capacitor/camera**: Captura de fotografías
- **@capacitor/filesystem**: Almacenamiento de archivos
- **@capacitor/preferences**: Persistencia de configuraciones

### Configuración de Permisos

La aplicación requiere los siguientes permisos:

**Android** (`android/app/src/main/AndroidManifest.xml`):
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

**iOS** (`ios/App/App/Info.plist`):
```xml
<key>NSCameraUsageDescription</key>
<string>Esta aplicación necesita acceso a la cámara para tomar fotografías.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Esta aplicación necesita acceso a la galería para seleccionar fotografías.</string>
```

## 🧪 Testing

```bash
# Ejecutar tests unitarios
npm run test

# Ejecutar tests e2e
npm run e2e
```

## 🏗️ Compilación para Producción

```bash
# Compilar para web
ionic build --prod

# Compilar para móvil
ionic build --prod
ionic cap sync
```

## 📄 Scripts Disponibles

- `npm start` - Ejecutar en modo desarrollo
- `npm run build` - Compilar la aplicación
- `npm run test` - Ejecutar tests
- `npm run lint` - Verificar código con ESLint
- `ionic serve` - Servidor de desarrollo
- `ionic build` - Compilar aplicación
- `ionic cap sync` - Sincronizar plugins nativos

## 🚦 Estado del Proyecto

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

### Versión Actual: **v1.0.0**
- ✅ Template básico de Ionic funcionando
- ✅ Navegación por pestañas implementada
- ✅ Estructura base para funcionalidades futuras
- 🔄 Sistema de etiquetas en desarrollo
- 🔄 Integración con cámara en desarrollo

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📝 Changelog

### v1.0.0 (29/10/2025)
- ✅ Proyecto inicial creado con Ionic Angular
- ✅ Configuración básica de Capacitor
- ✅ Estructura de navegación por pestañas
- ✅ Configuración de build y desarrollo

## 📞 Soporte

Si encuentras algún problema o tienes preguntas:

- 🐛 **Issues**: [GitHub Issues](https://github.com/vfcp-poligran/MediaTagger/issues)
- 📧 **Email**: Contacta al equipo de desarrollo
- 📚 **Documentación**: [Ionic Docs](https://ionicframework.com/docs)

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 Agradecimientos

- [Ionic Team](https://ionicframework.com/) por el excelente framework
- [Angular Team](https://angular.io/) por el framework web
- [Capacitor Team](https://capacitorjs.com/) por la integración nativa

---

**Desarrollado con ❤️ por el equipo de VFCP Poligrán**
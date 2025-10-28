# 📸 MediaTagger

Aplicación móvil multiplataforma para organizar y etiquetar fotos de manera inteligente.

## 🚀 Características

- **Captura de Fotos**: Toma fotos directamente desde la aplicación
- **Sistema de Etiquetas**: Organiza tus fotos con etiquetas personalizadas
- **Búsqueda Inteligente**: Encuentra fotos rápidamente usando etiquetas
- **Almacenamiento Local**: Todas las fotos se guardan en tu dispositivo
- **Diseño Responsivo**: Interfaz optimizada para diferentes pantallas

## 🛠️ Tecnologías

- **Ionic 7**: Framework para aplicaciones híbridas
- **Angular 17**: Framework web moderno
- **Capacitor 5**: Acceso a funcionalidades nativas
- **TypeScript**: Lenguaje de programación tipado
- **SCSS**: Preprocesador CSS

## 📱 Instalación y Ejecución

### Prerrequisitos

- Node.js 18+
- npm o yarn
- Ionic CLI

### Configuración del Proyecto

```bash
# Clonar el repositorio
git clone https://github.com/vfcp-poligran/MediaTagger.git
cd MediaTagger

# Instalar dependencias
npm install

# Instalar plugins de Capacitor
npm install @capacitor/camera @capacitor/filesystem @capacitor/preferences @capacitor/device

# Ejecutar en el navegador
ionic serve
```

### Compilación para Dispositivos

#### Android

```bash
# Compilar para producción
ionic build

# Agregar plataforma Android
ionic cap add android

# Sincronizar cambios
ionic cap sync android

# Abrir en Android Studio
ionic cap open android
```

#### iOS (requiere macOS)

```bash
# Compilar para producción
ionic build

# Agregar plataforma iOS
ionic cap add ios

# Sincronizar cambios
ionic cap sync ios

# Abrir en Xcode
ionic cap open ios
```

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── services/
│   │   └── photo.service.ts      # Servicio principal de fotos
│   ├── tab1/                     # Galería de fotos
│   ├── tab2/                     # Gestión de etiquetas
│   ├── tab3/                     # Información de la app
│   └── tabs/                     # Navegación por pestañas
├── assets/                       # Recursos estáticos
├── theme/
│   └── variables.scss            # Variables de tema
└── environments/                 # Configuraciones de entorno
```

## 🎓 Proyecto Académico

Este proyecto fue desarrollado como parte del curso de **Énfasis en Programación Móvil** del Politécnico Grancolombiano.

## 📄 Licencia

Este proyecto es parte de un trabajo académico y está disponible para fines educativos.

## 🤝 Contribuciones

Este es un proyecto académico. Para sugerencias o mejoras, por favor abre un issue.

---

**Desarrollado con ❤️ para el aprendizaje**
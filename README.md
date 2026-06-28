# Setup Launcher

Aplicación de escritorio para Windows que permite crear perfiles de aplicaciones y carpetas, y lanzarlos todos con un solo clic.

![Electron](https://img.shields.io/badge/Electron-35.0.0-blue)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![License](https://img.shields.io/badge/license-All%20Rights%20Reserved-red)

## Características

- **Perfiles personalizables**: Creá perfiles con nombre, icono y descripción
- **Aplicaciones + Carpetas**: Agregá ejecutables (.exe) y carpetas al mismo perfil
- **Búsqueda inteligente**: Buscá aplicaciones instaladas con búsqueda fuzzy (70% de coincidencia)
- **Grupos de pestañas**: Organizá carpetas en grupos para abrirlas en secuencia
- **3 fuentes de escaneo**: Menú Inicio, Registro de Windows y UWP
- **Lanzamiento rápido**: Iniciá todo tu setup con un solo botón
- **Tema oscuro**: Interfaz moderna con animaciones suaves

## Requisitos

- Windows 10/11
- Node.js 20+
- npm o pnpm

## Instalación

```bash
git clone https://github.com/ManyHuer/setup_launcher.git
cd setup_launcher
npm install --legacy-peer-deps
```

## Desarrollo

```bash
# Modo desarrollo (con hot reload)
npm run electron:dev

# Build del frontend
npm run build
```

## Build para producción

```bash
# Genera el ejecutable (.exe)
npm run electron:build
```

El output se encuentra en la carpeta `dist/`.

## Estructura del proyecto

```
setup_launcher/
├── electron/          # Proceso principal (Node.js)
│   ├── main.js        # Entry point de Electron
│   ├── ipcHandlers.js # Comunicación IPC
│   ├── preload.cjs    # API expuesta al renderer
│   └── startMenuScanner.js  # Escaneo de apps
├── database/          # SQLite (sql.js)
│   ├── schema.js      # Definición de tablas
│   ├── queries.js     # CRUD
│   └── connection.js  # Conexión a sql.js
├── src/               # Frontend (React)
│   ├── screens/       # HomeScreen, ProfileForm
│   ├── components/    # AppModal, ProfileCard
│   └── styles/        # globals.css
└── dist/              # Build output (no commitear)
```

## Tecnologías

- **Electron** — Framework de escritorio
- **React + Vite** — Frontend con hot reload
- **sql.js** — SQLite en WASM (sin compilación nativa)
- **Fuse.js** — Búsqueda fuzzy de aplicaciones
- **PowerShell** — Escaneo de apps instaladas

## Licencia

**All Rights Reserved** — Este proyecto es propiedad exclusiva de ManyHuer. No se permite el uso, copia, modificación ni distribución sin autorización expresa.

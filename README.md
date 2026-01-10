# VCPM - Voxel Core Project Manager

CLI util for managing voxel core content packs, with vcpm we can start new project and build it for release

## Instalation

```
npm i -g vcpm
```

## Usage

### Build
```
vcpm build
```
Creates a zip archive for production use, removing in production build all files and folders which starts on dot, and remove type declarations folder.

### Development Build
```
vcpm build -d | -dev
```
Creates a zip archive for development use, without removing any files or folders.

Archive format [pack_id]\_[version].zip

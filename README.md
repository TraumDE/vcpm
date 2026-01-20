![logo.png](logo.png)

# VCPM - Voxel Core Project Manager

CLI util for managing voxel core content packs, with vcpm we can start 
new project and build it for release

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/vcpm.svg)](https://npmjs.org/package/vcpm)
[![Downloads/week](https://img.shields.io/npm/dw/vcpm.svg)](https://npmjs.org/package/vcpm)

- [Installation](#installation)
- [Usage](#usage)
- [Commands](#commands)
- [Roadmap](#roadmap)
- [Support OS](#support-os)

## Installation

```bash
npm i -g vcpm
```

## Usage

### Run command

```Bash
vcpm COMMAND
```

### Check version

```Bash
vcpm --version | -v
```

### Help with command

```Bash
vcpm COMMAND --help
```

## Commands

- [`vcpm build`](#vcpm-build)
- [`vcpm autocomplete`](#vcpm-autocomplete)

### `vcpm build`

Build project

```Bash
USAGE
  $ vcpm build [-d]

FLAGS
  -d, --dev  build in development mode

DESCRIPTION
  build project
```

_See code: [src/commands/build/index.ts](https://github.com/TraumDE/vcpm/blob/main/src/commands/build/index.ts)_

### `vcpm autocomplete`

Display autocomplete installation instructions.

```Bash
USAGE
  $ vcpm autocomplete [SHELL] [-r]

ARGUMENTS
  [SHELL]  (zsh|bash|powershell) Shell type

FLAGS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

DESCRIPTION
  Display autocomplete installation instructions.

EXAMPLES
  $ vcpm autocomplete

  $ vcpm autocomplete bash

  $ vcpm autocomplete zsh

  $ vcpm autocomplete powershell

  $ vcpm autocomplete --refresh-cache
```

## Roadmap

### Plans

- [ ] Made standalone verison
- [ ] Package management function
- [ ] Create new project command
- [ ] More features coming soon

### Ready

- [x] Building project for production and development
- [x] Autocomplete for crossplaforms

## Support Shells

- [x] Bash
- [x] Zsh
- [x] Powershell 7+

## Support OS

### Windows

- Windows 11 ❓ - 0.2.2 (need update)

### Linux

- Arch Linux ✅ - 0.3.0

### MacOS

No tests on MacOS

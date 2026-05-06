import type {PathLike} from 'node:fs'

import {Command, Flags} from '@oclif/core'
import AdmZip from 'adm-zip'
import {glob, Path} from 'glob'
import {promises as fs} from 'node:fs'

import type {PackageInfo} from '../../types/index.js'

export class Build extends Command {
  static description = 'Build project'
  static flags = {
    dev: Flags.boolean({char: 'd', description: 'Build in development mode'}),
  }

  public async run(): Promise<void> {
    await this.build()
  }

  private async build(): Promise<void> {
    const packageInfo: PackageInfo = await this.readPackage()
    const {flags} = await this.parse(Build)

    this.log('Start building...')

    if (await this.fileExists('dist')) {
      this.log('Remove previous build...')
      await fs.rm('dist', {force: true, recursive: true})
    }

    await fs.mkdir('dist')

    const files: Path[] = await glob('**/*', {
      cwd: process.cwd(),
      dot: true,
      ignore: flags.dev ? [] : ['**/.*', '**/.*/**', 'dist/**/*', 'modules/types/**/*'],
      nodir: true,
      withFileTypes: true,
    })

    const zip = new AdmZip()

    for await (const file of files) {
      const relativePath = file.relative()
      const fileBuffer = await fs.readFile(relativePath)
      zip.addFile(relativePath, fileBuffer)
    }

    await fs.writeFile(`dist/${packageInfo.id}_${packageInfo.version}${flags.dev ? '_dev' : ''}.zip`, zip.toBuffer())

    if (flags.dev) {
      this.log('Development build completed!')
    } else {
      this.log('Production build completed!')
    }
  }

  private async fileExists(file: PathLike): Promise<boolean> {
    try {
      await fs.access(file, fs.constants.F_OK)
      return true
    } catch {
      return false
    }
  }

  private async readPackage(): Promise<PackageInfo> {
    if (!(await this.fileExists('package.json'))) {
      this.error('package.json file does not exist')
    }

    const packageJsonParsed = JSON.parse(await fs.readFile('package.json', 'utf8'))

    if (!packageJsonParsed.id || !packageJsonParsed.version) {
      this.error('Its not voxel core content pack')
    }

    const validPackageId = (): boolean => {
      const idRegex = /^[a-zA-Z_][a-zA-Z0-9_]{1,23}$/
      return idRegex.test(packageJsonParsed.id)
    }

    const validPackageVersion = (): boolean => {
      const versionRegex = /^\d+\.\d+\.\d+$/
      return versionRegex.test(packageJsonParsed.version)
    }

    if (!validPackageId()) {
      this.error(
        'Package ID must start with a letter or underscore, contain only letters, numbers, and underscores, and be 2-24 characters long',
      )
    }

    if (!validPackageVersion()) {
      this.error('Version must be in the format X.Y.Z')
    }

    return {
      id: packageJsonParsed.id,
      version: packageJsonParsed.version,
    }
  }
}

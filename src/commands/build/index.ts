import {Command, Flags} from '@oclif/core'
import {BlobReader, BlobWriter, ZipWriter} from '@zip.js/zip.js'
import {glob, Path} from 'glob'
import {Buffer} from 'node:buffer'
import {promises as fs, PathLike} from 'node:fs'

import type {PackageInfo} from '../../types/index.js'

export class Build extends Command {
  static description = 'Build project'
  static flags = {
    dev: Flags.boolean({char: 'd', description: 'Build in development mode'}),
  }

  public async run(): Promise<void> {
    await this.build()
  }

  private async addFile(file: Path, zipWriter: ZipWriter<Blob>): Promise<void> {
    const relativePath: string = file.relative()
    await zipWriter.add(relativePath, new BlobReader(new Blob([new Uint8Array(await fs.readFile(relativePath))])))
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
    const zipFileWriter: BlobWriter = new BlobWriter('application/zip')
    const zipWriter: ZipWriter<Blob> = new ZipWriter(zipFileWriter)
    const filePromises: Promise<void>[] = files.map((file) => this.addFile(file, zipWriter))
    await Promise.all(filePromises)

    const zipBlob: Blob = await zipWriter.close()
    const buffer: Buffer = Buffer.from(await zipBlob.arrayBuffer())

    await fs.writeFile(`dist/${packageInfo.id}_${packageInfo.version}${flags.dev ? '_dev' : ''}.zip`, buffer)

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
      this.error('package.json file does not exist', {
        code: 'ENOENT',
      })
    }

    const packageJsonParsed = JSON.parse(await fs.readFile('package.json', 'utf8'))

    if (!packageJsonParsed.id && !packageJsonParsed.version) {
      this.error('Its not voxel core content pack', {
        code: 'EINVAL',
      })
    }

    return {
      id: packageJsonParsed.id,
      version: packageJsonParsed.version,
    }
  }
}

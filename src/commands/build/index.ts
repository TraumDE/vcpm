import {Command, Flags} from '@oclif/core'
import {BlobReader, BlobWriter, ZipWriter} from '@zip.js/zip.js'
import {glob, Path} from 'glob'
import {Buffer} from 'node:buffer'
import {promises as fs} from 'node:fs'

import type {PackageInfo} from '../../types/index.js'

export class Build extends Command {
  static description = 'build project'
  static flags = {
    dev: Flags.boolean({char: 'd', description: 'build in development mode'}),
  }

  public async run(): Promise<void> {
    this.log('Start building...')
    await this.build()
  }

  private async addFile(file: Path, zipWriter: ZipWriter<Blob>): Promise<void> {
    const relativePath: string = file.relative()
    await zipWriter.add(relativePath, new BlobReader(new Blob([new Uint8Array(await fs.readFile(relativePath))])))
  }

  private async build(): Promise<void> {
    try {
      await fs.access('dist')
    } catch {
      await fs.mkdir('dist')
    }

    const zipFileWriter: BlobWriter = new BlobWriter('application/zip')
    const zipWriter: ZipWriter<Blob> = new ZipWriter(zipFileWriter)
    const {flags} = await this.parse(Build)

    const files: Path[] = await glob('**/*', {
      cwd: process.cwd(),
      dot: true,
      ignore: flags.dev ? [] : ['**/.*', '**/.*/**', 'dist/**/*', 'modules/types/**/*'],
      nodir: true,
      withFileTypes: true,
    })
    const filePromises: Promise<void>[] = files.map((file) => this.addFile(file, zipWriter))
    await Promise.all(filePromises)

    const zipBlob: Blob = await zipWriter.close()
    const buffer: Buffer = Buffer.from(await zipBlob.arrayBuffer())

    const packageInfo: PackageInfo = await this.readPackage()
    await fs.writeFile(`dist/${packageInfo.id}_${packageInfo.version}.zip`, buffer)

    if (flags.dev) {
      this.log('Development build completed!')
    } else {
      this.log('Production build completed!')
    }
  }

  private async readPackage(): Promise<PackageInfo> {
    const packageJsonParsed = JSON.parse(await fs.readFile('package.json', 'utf8'))

    return {
      id: packageJsonParsed.id,
      version: packageJsonParsed.version,
    }
  }
}

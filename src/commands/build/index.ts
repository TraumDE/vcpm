import {Command, Flags} from '@oclif/core'
import {BlobReader, BlobWriter, ZipWriter} from '@zip.js/zip.js'
import {glob, Path} from 'glob'
import {Buffer} from 'node:buffer'
import {promises as fs} from 'node:fs'
import {join} from 'node:path'

export class Build extends Command {
  static description = 'build project'
  static flags = {
    dev: Flags.boolean({char: 'd'}),
  }

  public async run(): Promise<void> {
    this.log('Start building...')
    await this.build()
  }

  private async addFile(file: Path, zipWriter: ZipWriter<Blob>): Promise<void> {
    const blobReader: BlobReader = new BlobReader(new Blob([new Uint8Array(await fs.readFile(file.relative()))]))
    await zipWriter.add(file.relative(), blobReader)
  }

  private async build(): Promise<void> {
    const zipFileWriter: BlobWriter = new BlobWriter('application/zip')
    const zipWriter: ZipWriter<Blob> = new ZipWriter(zipFileWriter)
    const files: Path[] = await glob('**/*', {
      cwd: process.cwd(),
      ignore: ['node_modules/**/*', 'dist/**/*'],
      nodir: true,

      withFileTypes: true,
    })
    const filePromises: Promise<void>[] = files.map((file) => this.addFile(file, zipWriter))

    await Promise.all(filePromises)

    const zipBlob: Blob = await zipWriter.close()
    const buffer: Buffer = Buffer.from(await zipBlob.arrayBuffer())

    await fs.writeFile('Archive.zip', buffer)

    this.log('Producion build completed!')
  }
}

import {Command, Flags} from '@oclif/core'
import {BlobReader, BlobWriter, ZipWriter} from '@zip.js/zip.js'
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

  private async build(): Promise<void> {
    const zipFileWriter: BlobWriter = new BlobWriter('application/zip')
    const zipWriter: ZipWriter<Blob> = new ZipWriter(zipFileWriter)

    const test: Buffer = await fs.readFile(join(process.cwd(), 'LICENSE'))
    const blobs: Blob = new Blob([new Uint8Array(test)])
    const blobReader: BlobReader = new BlobReader(blobs)
    await zipWriter.add('LICENSE', blobReader)

    const zipBlob: Blob = await zipWriter.close()
    const buffer: Buffer = Buffer.from(await zipBlob.arrayBuffer())
    await fs.writeFile('Archive.zip', buffer)

    this.log('Producion build completed!')
  }
}

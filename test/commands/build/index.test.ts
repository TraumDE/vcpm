import {runCommand} from '@oclif/test'
import {Entry, FileEntry, TextWriter, Uint8ArrayReader, Uint8ArrayWriter, ZipReader} from '@zip.js/zip.js'
import {expect} from 'chai'
import {mkdir, mkdtemp, readdir, readFile, rm, writeFile} from 'node:fs/promises'
import {join} from 'node:path'

import type {PackageInfo} from '../../../src/types/package-info'

let testDir: string
let originalCwd: string

const rightPackageData: PackageInfo = {
  id: 'test_package',
  version: '1.0.0',
}

const testFileText: string = 'test'

const productionBuildName: string = 'test_package_1.0.0.zip'
const developmentBuildName: string = 'test_package_1.0.0_dev.zip'

const normalizeFilenames = (files: FileEntry[]): string[] => {
  const normalizedFilenames = files.map((file) => file.filename.replaceAll('\\', '/'))
  return normalizedFilenames
}

const createDevFiles = async (): Promise<void> => {
  await writeFile('.gitignore', testFileText)
  await mkdir('.git')
  await writeFile('.git/HEAD', testFileText)
  await mkdir('modules/types', {recursive: true})
  await writeFile('modules/types/index.lua', testFileText)
}

const createOtherFiles = async (): Promise<void> => {
  await writeFile('index.lua', 'test code')
  await writeFile('modules/index.lua', testFileText)
  await mkdir('config')
  await writeFile('config/README.md', testFileText)
  await mkdir('dist')
}

describe('build', () => {
  beforeEach(async () => {
    originalCwd = process.cwd()
    testDir = await mkdtemp(join(process.cwd(), 'test-build-'))
    process.chdir(testDir)
  })

  afterEach(async () => {
    process.chdir(originalCwd)
    await rm(testDir, {force: true, recursive: true})
  })

  it('build in production mode', async () => {
    await writeFile('package.json', JSON.stringify(rightPackageData))

    await createDevFiles()
    await createOtherFiles()

    const {stdout} = await runCommand('build')

    expect(stdout).to.contain('Start building...')
    expect(stdout).to.contain('Remove previous build...')
    expect(stdout).to.contain('Production build completed!')

    const distDir: string[] = await readdir('dist')

    expect(distDir).to.include(productionBuildName)

    const zipBuffer: Buffer = await readFile(join('dist', productionBuildName))
    const uInt8Array: Uint8Array = new Uint8Array(zipBuffer)
    const zipReader: ZipReader<Uint8ArrayReader> = new ZipReader(new Uint8ArrayReader(uInt8Array))
    const entries: Entry[] = await zipReader.getEntries()
    const files: FileEntry[] = entries.filter((entry) => !entry.directory)
    const normalizedFilenames: string[] = normalizeFilenames(files)

    expect(normalizedFilenames).to.include('package.json')
    expect(normalizedFilenames).to.include('modules/index.lua')
    expect(normalizedFilenames).to.include('config/README.md')

    expect(normalizedFilenames).to.not.include('.git/HEAD')
    expect(normalizedFilenames).to.not.include('.gitignore')
    expect(normalizedFilenames).to.not.include('modules/types/index.lua')

    const fileChecks = files.map(async (file) => {
      const data = await file.getData(new Uint8ArrayWriter())
      return {
        filename: file.filename,
        isEmpty: data.length === 0,
      }
    })
    const fileCheckResults = await Promise.all(fileChecks)

    for (const {filename, isEmpty} of fileCheckResults) {
      expect(isEmpty, `File "${filename}" is empty`).to.be.false
    }

    const packageJsonContent: string | undefined = await files
      .find((file) => file.filename === 'package.json')
      ?.getData(new TextWriter())
    const packageJsonParsed: PackageInfo | undefined = packageJsonContent ? JSON.parse(packageJsonContent) : undefined

    expect(packageJsonParsed?.id).to.be.a('string').and.not.empty
    expect(packageJsonParsed?.version).to.be.a('string').and.not.empty

    await zipReader.close()
  })

  it('build in development mode', async () => {
    await writeFile('package.json', JSON.stringify(rightPackageData))

    await createDevFiles()
    await createOtherFiles()

    const {stdout} = await runCommand('build --dev')

    expect(stdout).to.contain('Start building...')
    expect(stdout).to.contain('Remove previous build...')
    expect(stdout).to.contain('Development build completed!')

    const distDir: string[] = await readdir('dist')

    expect(distDir).to.include(developmentBuildName)

    const zipBuffer: Buffer = await readFile(join('dist', developmentBuildName))
    const uInt8Array: Uint8Array = new Uint8Array(zipBuffer)
    const zipReader: ZipReader<Uint8ArrayReader> = new ZipReader(new Uint8ArrayReader(uInt8Array))
    const entries: Entry[] = await zipReader.getEntries()
    const files: FileEntry[] = entries.filter((entry) => !entry.directory)
    const normalizedFilenames: string[] = normalizeFilenames(files)

    expect(normalizedFilenames).to.include('package.json')
    expect(normalizedFilenames).to.include('modules/index.lua')
    expect(normalizedFilenames).to.include('config/README.md')
    expect(normalizedFilenames).to.include('.git/HEAD')
    expect(normalizedFilenames).to.include('.gitignore')
    expect(normalizedFilenames).to.include('modules/types/index.lua')

    const fileChecks = files.map(async (file) => {
      const data = await file.getData(new Uint8ArrayWriter())
      return {
        filename: file.filename,
        isEmpty: data.length === 0,
      }
    })
    const fileCheckResults = await Promise.all(fileChecks)

    for (const {filename, isEmpty} of fileCheckResults) {
      expect(isEmpty, `File "${filename}" is empty`).to.be.false
    }

    const packageJsonContent: string | undefined = await files
      .find((file) => file.filename === 'package.json')
      ?.getData(new TextWriter())
    const packageJsonParsed: PackageInfo | undefined = packageJsonContent ? JSON.parse(packageJsonContent) : undefined

    expect(packageJsonParsed?.id).to.be.a('string').and.not.empty
    expect(packageJsonParsed?.version).to.be.a('string').and.not.empty

    await zipReader.close()
  })

  it('cause error if package.json not exists', async () => {
    const {error} = await runCommand('build')
    expect(error?.message).to.contain('package.json file does not exist')
    expect(error?.oclif?.exit).to.equal(2)
  })

  it('cause error if package.json data is wrong', async () => {
    await writeFile(
      'package.json',
      JSON.stringify({
        name: 'test-name',
      }),
    )
    const {error} = await runCommand('build')
    expect(error?.oclif?.exit).to.equal(2)
  })

  it('cause error if package.json data is partial', async () => {
    await writeFile(
      'package.json',
      JSON.stringify({
        name: 'test_name',
        version: '1.0.0',
      }),
    )
    const {error} = await runCommand('build')
    expect(error?.message).to.contain('Its not voxel core content pack')
    expect(error?.oclif?.exit).to.equal(2)
  })

  it('cause error if package.json id is invalid', async () => {
    await writeFile(
      'package.json',
      JSON.stringify({
        id: '123seaeasw-dsadsadsdasdsadddsasadasdadsad',
        version: '0.0.0',
      }),
    )
    const {error} = await runCommand('build')
    expect(error?.message).to.contain(
      'Package ID must start with a letter or underscore, contain only letters, numbers, and underscores, and be 2-24 characters long',
    )
    expect(error?.oclif?.exit).to.equal(2)
  })

  it('cause error if package.json version is invalid', async () => {
    await writeFile(
      'package.json',
      JSON.stringify({
        id: 'dsasddsa_dsadsa',
        version: 'invalid-version',
      }),
    )
    const {error} = await runCommand('build')
    expect(error?.message).to.contain('Version must be in the format X.Y.Z')
    expect(error?.oclif?.exit).to.equal(2)
  })
})

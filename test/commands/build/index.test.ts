import {runCommand} from '@oclif/test'
import AdmZip from 'adm-zip'
import {expect} from 'chai'
import {mkdir, mkdtemp, readdir, rm, writeFile} from 'node:fs/promises'
import {join} from 'node:path'

import type {PackageInfo} from '../../../src/types/package-info'

import {ERRORS} from '../../../src/errors/messages'

let testDir: string
let originalCwd: string

const rightPackageData: PackageInfo = {
  id: 'test_package',
  version: '1.0.0',
}

const testFileText: string = 'test'

const productionBuildName: string = 'test_package_1.0.0.zip'
const developmentBuildName: string = 'test_package_1.0.0_dev.zip'

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

    const zip = new AdmZip(join('dist', productionBuildName))
    const zipEntries = zip.getEntries()
    const fileNames = zipEntries.map((zipEntry) => zipEntry.entryName)

    expect(fileNames).to.include('package.json')
    expect(fileNames).to.include('modules/index.lua')
    expect(fileNames).to.include('config/README.md')

    expect(fileNames).to.not.include('.git/HEAD')
    expect(fileNames).to.not.include('.gitignore')
    expect(fileNames).to.not.include('modules/types/index.lua')

    for (const entry of zipEntries) {
      const data = entry.getData()
      expect(data.length === 0, `File ${entry.entryName} is empty`).to.be.false
    }

    const packageJsonContent: string | undefined = zipEntries
      .find((zipEntry) => zipEntry.entryName === 'package.json')
      ?.getData()
      .toString('utf8')
    const packageJsonParsed: PackageInfo | undefined = packageJsonContent ? JSON.parse(packageJsonContent) : undefined

    expect(packageJsonParsed?.id).to.be.a('string').and.not.empty
    expect(packageJsonParsed?.version).to.be.a('string').and.not.empty
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

    const zip = new AdmZip(join('dist', developmentBuildName))
    const zipEntries = zip.getEntries()
    const fileNames = zipEntries.map((zipEntry) => zipEntry.entryName)

    expect(fileNames).to.include('package.json')
    expect(fileNames).to.include('modules/index.lua')
    expect(fileNames).to.include('config/README.md')
    expect(fileNames).to.include('.git/HEAD')
    expect(fileNames).to.include('.gitignore')
    expect(fileNames).to.include('modules/types/index.lua')

    for (const entry of zipEntries) {
      const data = entry.getData()
      expect(data.length === 0, `File ${entry.entryName} is empty`).to.be.false
    }

    const packageJsonContent: string | undefined = zipEntries
      .find((zipEntry) => zipEntry.entryName === 'package.json')
      ?.getData()
      .toString('utf8')

    const packageJsonParsed: PackageInfo | undefined = packageJsonContent ? JSON.parse(packageJsonContent) : undefined

    expect(packageJsonParsed?.id).to.be.a('string').and.not.empty
    expect(packageJsonParsed?.version).to.be.a('string').and.not.empty
  })

  it('cause error if package.json not exists', async () => {
    const {error} = await runCommand('build')
    expect(error?.message).to.contain(ERRORS.MISSING_PACKAGE_JSON)
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
    expect(error?.message).to.contain(ERRORS.NOT_VOXEL_CORE_PACKAGE)
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
    expect(error?.message).to.contain(ERRORS.WRONG_PACK_ID)
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
    expect(error?.message).to.contain(ERRORS.WRONG_PACK_VERSION)
    expect(error?.oclif?.exit).to.equal(2)
  })
})

import {runCommand} from '@oclif/test'
import {Entry, FileEntry, TextWriter, Uint8ArrayReader, Uint8ArrayWriter, ZipReader} from '@zip.js/zip.js'
import {expect} from 'chai'
import {mkdir, mkdtemp, readdir, readFile, rm, writeFile} from 'node:fs/promises'
import {join} from 'node:path'

import type {PackageInfo} from '../../../src/types/package-info'

describe('build', () => {
  let testDir: string
  let originalCwd: string

  const rightPackageData: PackageInfo = {
    id: 'test-package',
    version: '1.0.0',
  }

  const testFileText: string = 'test'

  const productionBuildName: string = 'test-package_1.0.0.zip'
  const developmentBuildName: string = 'test-package_1.0.0_dev.zip'

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

    expect(stdout).to.contain('Remove previous build...')
    expect(stdout).to.contain('Start building...')
    expect(stdout).to.contain('Production build completed!')

    const distDir: string[] = await readdir('dist')

    expect(distDir).to.include(productionBuildName)

    const zipBuffer: Buffer = await readFile(join('dist', productionBuildName))
    const uInt8Array: Uint8Array = new Uint8Array(zipBuffer)
    const zipReader: ZipReader<Uint8ArrayReader> = new ZipReader(new Uint8ArrayReader(uInt8Array))
    const entries: Entry[] = await zipReader.getEntries()
    const files: FileEntry[] = entries.filter((entry) => !entry.directory)
    const filenames: string[] = entries.filter((entry) => !entry.directory).map((entry) => entry.filename)

    expect(filenames).to.include('package.json')
    expect(filenames).to.include('modules/index.lua')
    expect(filenames).to.include('config/README.md')

    expect(filenames).to.not.include('.git/HEAD')
    expect(filenames).to.not.include('.gitignore')
    expect(filenames).to.not.include('modules/types/index.lua')

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

    expect(stdout).to.contain('Remove previous build...')
    expect(stdout).to.contain('Start building...')
    expect(stdout).to.contain('Development build completed!')

    const distDir: string[] = await readdir('dist')

    expect(distDir).to.include(developmentBuildName)

    const zipBuffer: Buffer = await readFile(join('dist', developmentBuildName))
    const uInt8Array: Uint8Array = new Uint8Array(zipBuffer)
    const zipReader: ZipReader<Uint8ArrayReader> = new ZipReader(new Uint8ArrayReader(uInt8Array))
    const entries: Entry[] = await zipReader.getEntries()
    const files: FileEntry[] = entries.filter((entry) => !entry.directory)
    const filenames: string[] = entries.filter((entry) => !entry.directory).map((entry) => entry.filename)

    expect(filenames).to.include('package.json')
    expect(filenames).to.include('modules/index.lua')
    expect(filenames).to.include('config/README.md')
    expect(filenames).to.include('.git/HEAD')
    expect(filenames).to.include('.gitignore')
    expect(filenames).to.include('modules/types/index.lua')

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
        name: 'test-name',
        version: '1.0.0',
      }),
    )
    const {error} = await runCommand('build')
    expect(error?.oclif?.exit).to.equal(2)
  })
})

// describe('build', () => {
//   // Временная директория для тестов
//   let testDir: string

//   beforeEach(async () => {
//     // Создаём временную директорию для тестов
//     testDir = await mkdtemp(join(process.cwd(), 'test-build-'))
//   })

//   afterEach(async () => {
//     // Удаляем временную директорию после теста
//     if (testDir) {
//       await rm(testDir, {force: true, recursive: true})
//     }
//   })

//   it('runs build command and creates zip file', async () => {
//     // Подготовка тестовой среды
//     const originalCwd = process.cwd()

//     try {
//       // Меняем текущую директорию на тестовую
//       process.chdir(testDir)

//       // Создаём тестовый package.json
//       await writeFile(
//         'package.json',
//         JSON.stringify({
//           id: 'test-package',
//           version: '1.0.0',
//         }),
//       )

//       // Создаём тестовые файлы
//       await writeFile('file1.txt', 'content1')
//       await mkdir('subdir', {recursive: true})
//       await writeFile('subdir/file2.txt', 'content2')

//       const {stdout} = await runCommand(['build'])

//       // Проверяем логи
//       expect(stdout).to.contain('Start building...')
//       expect(stdout).to.contain('Production build completed!')

//       // Проверяем, что файл был создан
//       const expectedZipFile = 'dist/test-package_1.0.0.zip'
//       const distDir = await readdir('dist')
//       expect(distDir).to.have.length(1)
//       expect(distDir[0]).to.equal('test-package_1.0.0.zip')

//       // Проверяем содержимое файла
//       const zipContent = await readFile(expectedZipFile)
//       expect(zipContent).to.not.be.empty
//     } finally {
//       // Восстанавливаем оригинальную директорию
//       process.chdir(originalCwd)
//     }
//   })

//   it('runs build command in development mode', async () => {
//     const originalCwd = process.cwd()

//     try {
//       process.chdir(testDir)

//       await writeFile(
//         'package.json',
//         JSON.stringify({
//           id: 'test-package',
//           version: '1.0.0',
//         }),
//       )

//       await writeFile('file1.txt', 'content1')
//       await mkdir('.hidden-dir', {recursive: true})
//       await writeFile('.hidden-dir/hidden-file.txt', 'hidden-content')

//       const {stdout} = await runCommand(['build', '--dev'])

//       expect(stdout).to.contain('Start building...')
//       expect(stdout).to.contain('Development build completed!')

//       // В dev режиме должны быть включены скрытые файлы
//       const distDir = await readdir('dist')
//       expect(distDir).to.have.length(1)
//       expect(distDir[0]).to.include('_dev.zip')
//     } finally {
//       process.chdir(originalCwd)
//     }
//   })

//   it('fails when package.json does not exist', async () => {
//     const originalCwd = process.cwd()

//     try {
//       process.chdir(testDir)

//       // Не создаём package.json

//       let errorOccurred = false
//       try {
//         await runCommand(['build'])
//       } catch (error) {
//         errorOccurred = true
//         expect((error as Error).message).to.contain('package.json file does not exist')
//       }

//       expect(errorOccurred).to.be.true
//     } finally {
//       process.chdir(originalCwd)
//     }
//   })

//   it('fails when package.json has invalid format', async () => {
//     const originalCwd = process.cwd()

//     try {
//       process.chdir(testDir)

//       // Создаём невалидный package.json
//       await writeFile('package.json', '{ invalid json')

//       let errorOccurred = false
//       try {
//         await runCommand(['build'])
//       } catch {
//         errorOccurred = true
//       }

//       expect(errorOccurred).to.be.true
//     } finally {
//       process.chdir(originalCwd)
//     }
//   })

//   describe('build', () => {
//     test
//       .stdout()
//       .stderr()
//       .do(async () => {
//         // Создаём временную директорию и переходим в неё
//         await writeFile(
//           join(testDir, 'package.json'),
//           JSON.stringify({
//             name: 'test-package',
//             // нет id и version
//           }),
//         )
//       })
//       .cd(testDir)
//       .command(['build'])
//       .catch((error) => {
//         expect(error.message).to.contain('Its not voxel core content pack')
//       })
//       .it('fails when package.json missing required fields')
//   })
// })

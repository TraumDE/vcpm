import {PackageVersion} from '../types/package-info.js'

const versionRegex = /^\d+\.\d+\.\d+$/

const isValidPackageVersion = (version: PackageVersion): boolean => versionRegex.test(version)

export default isValidPackageVersion

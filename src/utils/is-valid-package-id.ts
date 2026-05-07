import type {PackageId} from '../types/package-info.js'

const idRegex = /^[a-zA-Z_][a-zA-Z0-9_]{1,23}$/

const isValidPackageId = (id: PackageId): boolean => idRegex.test(id)

export default isValidPackageId

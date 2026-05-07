export type PackageId = string
export type PackageVersion = `${string}.${string}.${string}`

export interface PackageInfo {
  id: PackageId
  version: PackageVersion
}

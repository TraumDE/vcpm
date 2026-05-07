export const ERRORS = {
  MISSING_PACKAGE_JSON: 'package.json file does not exist',
  NOT_VOXEL_CORE_PACKAGE: 'Its not voxel core content pack',
  WRONG_PACK_ID:
    'id can consist of Capital letters A-Z, lowercase letters a-z digits 0-9, and underscore "_" signs. The first character must not be a digit. Name length must be in range [2, 24]',
  WRONG_PACK_VERSION: 'Version must be in the format X.Y.Z',
} as const

export type ErrorKey = keyof typeof ERRORS

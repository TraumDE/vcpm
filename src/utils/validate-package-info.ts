import {error} from '@oclif/core/errors'

import type {PackageInfo} from '../types/package-info.js'

import {ERRORS} from '../errors/messages.js'

const validatePackageInfo = (packageInfo: Partial<PackageInfo>): void => {
  const {id, version} = packageInfo

  if (id && !/^[a-zA-Z_][a-zA-Z0-9_]{1,23}$/.test(id)) error(ERRORS.WRONG_PACK_ID)
  if (version && !/^\d+\.\d+\.\d+$/.test(version)) error(ERRORS.WRONG_PACK_VERSION)
}

export default validatePackageInfo

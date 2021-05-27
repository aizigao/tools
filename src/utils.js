import fs from 'fs-extra'
import filesize from 'filesize'

export const getExtFromFilePath = (filePath) => {
  return filePath.split('.').pop()
}

export function getFileSizeInMegabytes(filename) {
  const stats = fs.statSync(filename)
  return filesize(stats.size)
}

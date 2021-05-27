import fs from 'fs-extra'
import path from 'path'
import filesize from 'filesize'

export const getExtFromFilePath = (filePath) => {
  return filePath.split('.').pop()
}

export function getFileSizeInMegabytes(filename) {
  const stats = fs.statSync(filename)
  return filesize(stats.size)
}

export const fixPath = (source) => {
  return path.isAbsolute(source) ? source : path.join(process.cwd(), source)
}

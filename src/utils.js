import fs from 'fs-extra'
import filesize from 'filesize'

export const getExtFromFilePath = (filePath) => {
  return filePath.split('.').pop()
}

export function getFileSizeInMegabytes(filename) {
  const stats = fs.statSync(filename)
  return filesize(stats.size)
}

export const delay = (ms) => new Promise((res) => setTimeout(res, ms))
export const randomRange = (from, to) => {
  const delta = to - from
  return Math.round(Math.random() * delta + from)
}
export const delayRange = (f = 1000, t = 1500) => delay(randomRange(f, t))

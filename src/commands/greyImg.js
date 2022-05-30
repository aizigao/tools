import chalk from 'chalk'
import sharp from 'sharp'
import fs from 'fs-extra'
import path from 'path'
import klaw from 'klaw'
import tinify from 'tinify'
import { getExtFromFilePath } from '../utils'

const greyImgInner = async (options) => {
  const { source, tinifyKey } = options

  // jpg, png 文件
  const imgsfiles = []

  for await (const file of klaw(source, {})) {
    const ext = getExtFromFilePath(file.path)
    if (/^(png|jpg|jpeg)$/.test(ext)) {
      imgsfiles.push({ path: file.path, type: 'common' })
    } else if (ext === 'svg') {
      imgsfiles.push({ path: file.path, type: 'svg' })
    }
  }

  tinify.key = tinifyKey

  // -- 处理
  if (imgsfiles.length) {
    console.log(chalk.yellow(`文件总数 ${imgsfiles.length}`))
    console.log('------------------------------')

    await Promise.all(
      imgsfiles.map(async ({ path: filePath, type }) => {
        await sharp(filePath).toFile(filePath)
        console.log(`已处理: ${filePath}`)
      })
    )
  }
}

export async function greyImg(options) {
  const { source } = options

  const rSource = path.isAbsolute(source)
    ? source
    : path.join(process.cwd(), source)

  if (!fs.pathExistsSync(rSource)) {
    console.error(chalk.red('路径不存在!!'))
    process.exit(-1)
  }

  const newOptions = { ...options, source: rSource }
  await greyImgInner(newOptions)
  console.log('-------------------------')
  console.log(`${chalk.green('处理完成')}`)
}

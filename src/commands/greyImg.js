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
    }
  }

  tinify.key = tinifyKey

  // -- 处理
  if (imgsfiles.length) {
    console.log(chalk.yellow(`文件总数 ${imgsfiles.length}`))
    console.log('------------------------------')

    const errors = []
    await Promise.all(
      imgsfiles.map(async ({ path: filePath, type }) => {
        // console.log('filePath', filePath, type)
        await sharp(filePath)
          .greyscale()
          .toBuffer((err, buffer) => {
            if (err) {
              errors.push(err)
            }
            fs.writeFile(filePath, buffer, (e) => {})
          })
        console.log(`已处理: ${filePath}`)
      })
    )
    if (errors.length) {
      console.log(errors)
    }
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

import chalk from 'chalk'
import sharp from 'sharp'
import fs from 'fs-extra'
import path from 'path'
import klaw from 'klaw'
import tinify from 'tinify'
import { getExtFromFilePath } from '../utils'

const imgpInner = async (options) => {
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
        const sharpX = sharp(filePath)
        const meta = await sharpX.metadata()
        const rect = Buffer.from(
          `<svg  width='${meta.width}' height='${meta.height}'>
          <rect x="0" y="0" width="${meta.width}" height="${meta.height}" rx="24" ry="24" /></svg>`
        )
        await sharpX
          .composite([{ input: rect, blend: 'dest-in', top: 0, left: 0 }])
          // .removeAlpha()
          .toBuffer((err, buffer) => {
            if (err) {
              errors.push(err)
            }
            fs.writeFile(filePath.replace('.png', 'x.png'), buffer, (e) => {})
          })
        console.log(`已处理: ${filePath}`)
      })
    )
    if (errors.length) {
      console.log(errors)
    }
  }
}

export async function imgp(options) {
  const { source } = options

  const rSource = path.isAbsolute(source)
    ? source
    : path.join(process.cwd(), source)

  if (!fs.pathExistsSync(rSource)) {
    console.error(chalk.red('路径不存在!!'))
    process.exit(-1)
  }

  const newOptions = { ...options, source: rSource }
  await imgpInner(newOptions)
  console.log('-------------------------')
  console.log(`${chalk.green('处理完成')}`)
}

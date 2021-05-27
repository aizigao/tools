import chalk from 'chalk'
import dataStore from 'data-store'
import fs from 'fs-extra'
import path from 'path'
import os from 'os'
import inquirer from 'inquirer'
import klaw from 'klaw'
import tinify from 'tinify'
import { getExtFromFilePath, getFileSizeInMegabytes } from '../utils'
import { optimize as svgoOptimize } from 'svgo'

const configDir = path.join(os.homedir(), '.config')
const store = dataStore({ path: path.join(configDir, 'aizigao-tools.json') })

const getConfig = async (options) => {
  let hasTinifyKey = true
  if (options.config) {
    hasTinifyKey = false
  } else {
    hasTinifyKey = store.has('tinifyKey')
  }
  if (hasTinifyKey) {
    return {
      tinifyKey: store.get('tinifyKey'),
    }
  }
  console.log(chalk.red('请输入tinifykey https://tinypng.com/developers'))
  const questions = [
    {
      type: 'string',
      name: 'tinifyKey',
      message: 'tinifyKey',
    },
  ]
  const answers = await inquirer.prompt(questions)
  store.set('tinifyKey', answers.tinifyKey)
  return answers
}

const tinifyIt = async (options) => {
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
    console.log(chalk.yellow(`压缩中 文件总数 ${imgsfiles.length}`))
    console.log('------------------------------')

    await Promise.all(
      imgsfiles.map(async ({ path: filePath, type }) => {
        const oriSize = getFileSizeInMegabytes(filePath)
        console.log(
          `${chalk.yellow('正在处理文件')}: %s [%s] `,
          filePath,
          chalk.gray(oriSize)
        )

        if (type === 'common') {
          const source = tinify.fromFile(filePath)
          await new Promise((resolve, reject) => {
            source.toFile(filePath, (err) => {
              if (!err) {
                resolve()
              } else {
                reject(err)
              }
            })
          }).catch((e) => {
            console.log('tiny', e)
          })
        } else if (type === 'svg') {
          const content = fs.readFileSync(filePath, 'utf-8')

          const result = svgoOptimize(content, {})
          const optimizedSvgString = result.data
          fs.writeFileSync(filePath, optimizedSvgString)
        }
        console.log(
          `${chalk.green('ok')}: %s [%s][%s]`,
          filePath,
          chalk.green(getFileSizeInMegabytes(filePath)),
          chalk.red(oriSize)
        )
      })
    )
  }
}

export async function tinyImg(options) {
  const { source } = options
  const config = await getConfig(options)

  const rSource = path.isAbsolute(source)
    ? source
    : path.join(process.cwd(), source)
  if (!fs.pathExistsSync(rSource)) {
    console.error(chalk.red('路径不存在!!'))
    process.exit(-1)
  }

  const newOptions = { ...options, ...config, source: rSource }
  await tinifyIt(newOptions)
  console.log('-------------------------')
  console.log(`${chalk.green('处理完成')}`)
}

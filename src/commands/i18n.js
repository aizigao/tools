import qs from 'qs'
import os from 'os'
import _ from 'lodash'
import md5 from 'md5'
import axios from 'axios'
import chalk from 'chalk'
import dataStore from 'data-store'
import fs from 'fs-extra'
import path from 'path'
import inquirer from 'inquirer'
import { delayRange } from '../utils'

const configDir = path.join(os.homedir(), '.config')
const store = dataStore({ path: path.join(configDir, 'aizigao-tools.json') })

const CONFIG = {
  // "appid": "xxxxxxx",
  // "secret": "xxx",
  // "storeDir": "i18n",
  // "dictDir": "xxxxxxxx"

  ...store.get('i18n'),
  toList: [
    ['ar_AR.json', 'ara'],
    ['de_DE.json', 'de'],
    ['en_US.json', 'en'],
    ['es_ES.json', 'spa'],
    ['fr_FR.json', 'fra'],
    ['ja_JP.json', 'jp'],
    ['ko_KR.json', 'kor'],
    ['pt_PT.json', 'pt'],
    ['ru_RU.json', 'ru'],
    ['th_TH.json', 'th'],
    ['zh_CN.json', 'zh'],
    ['zh_TW.json', 'cht'],
  ],
}

async function translateSingle(from, to, query) {
  const appid = CONFIG.appid
  const q = query
  const salt = new Date().getTime()
  const secret = CONFIG.secret
  const signArr = [appid, q, salt, secret]
  const sign = md5(signArr.join(''))
  const rst = await axios.get(
    'http://api.fanyi.baidu.com/api/trans/vip/translate?' +
      qs.stringify({
        q,
        from,
        to,
        salt,
        sign,
        appid,
      })
  )
  // { from: 'en', to: 'zh', trans_result: [ { src: 'hello', dst: '你好' } ] }
  let result = rst.data
  if (result && _.has(result, 'trans_result[0].dst')) {
    return _.get(result, 'trans_result[0].dst')
  }
  return null
}

async function translate(options) {
  // The target language
  const { cn, en, force } = options

  console.log(`[cn]: ${cn} [en]: ${en}`)
  if (!cn || !en) {
    console.log(chalk.red('请输入 cn 或 en 值'))
    return
  }

  const dist = path.join(process.cwd(), CONFIG.storeDir)
  if (!fs.existsSync(dist)) {
    console.log('i18目录不存在，已生成')
    fs.mkdirSync(dist)
  }

  let count = 1
  for (const [fileName, toCode] of CONFIG.toList) {
    console.log(`------------ start ${count}, to ${toCode} ------------`)
    let result = null
    // 中文繁体与简体 处理
    const dictPath = path.join(CONFIG.dictDir, fileName)
    let dict = {}
    if (dictPath) {
      console.log(`${toCode} 已加载字典数据`)
      const dictContent = await fs.readFile(dictPath)
      dict = JSON.parse(dictContent)
    }

    let fileContent = {}
    const filePath = path.join(dist, fileName)
    if (fs.existsSync(filePath)) {
      const fileContentOrgin = await fs.readFile(filePath, 'utf-8')
      fileContent = JSON.parse(fileContentOrgin)
    }
    if (cn in fileContent) {
      console.log(chalk.red('已有对应i18n字段，跳过'))
    } else {
      if (!force && cn in dict) {
        console.log(`${cn} 已存在原i18n中，跳过`)
        result = dict[cn]
      } else {
        if (['cht', 'zh'].includes(toCode)) {
          console.log(`正在使用百度翻译 ${cn}`)
          result = await translateSingle('zh', toCode, cn)
        } else {
          console.log(`正在使用百度翻译 ${en}`)
          result = await translateSingle('en', toCode, en)
        }
        await delayRange()
      }
      if (result) {
        fileContent[cn] = result
      } else {
        console.error('没有对应内容', cn, toCode, result)
      }
    }
    console.log(`to ${chalk.yellow(toCode)}`, 'ok')
    fs.writeFile(filePath, JSON.stringify(fileContent))
    console.log(`------------ end ${count}, to ${toCode} ------------\n\n\n`)
    count += 1
  }
  console.log(chalk.green('ok finished 😚!!!!!!!!!!!!!!!!!!!!!!!'))
}

async function initProj() {
  console.log('使用百度翻译： https://api.fanyi.baidu.com/\n')
  const questions = [
    {
      type: 'string',
      name: 'appid',
      message: '百度翻译appid',
    },
    {
      type: 'string',
      name: 'secret',
      message: '百度翻译secret',
    },
    {
      type: 'string',
      name: 'storeDir',
      default: 'i18n',
      message: '存储目录名',
    },
    {
      type: '字典目录',
      name: 'dictDir',
      default: path.join(__dirname, '/_i18n_dict'),
      message: '字典目录',
    },
  ]
  const answers = await inquirer.prompt(questions)
  Object.assign(CONFIG, answers)
  store.set('i18n', answers)
}

export async function i18n(options) {
  const { init } = options

  if (init) {
    initProj()
  } else if (!store.has('i18n')) {
    console.log('请先初始化项目\n')
    console.log('npx @aizigao/tools i18n --init')
    process.exit(-999)
  } else {
    await translate(options)
  }
}

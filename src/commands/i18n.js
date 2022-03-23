import qs from 'qs'
import _ from 'lodash'
import md5 from 'md5'
import axios from 'axios'
import chalk from 'chalk'
import dataStore from 'data-store'
import fs from 'fs-extra'
import path from 'path'
import inquirer from 'inquirer'

const dist = path.join(process.cwd(), 'i18n')
const CONFIG = {
  appid: '20220323001136360',
  secret: 'XDnUbHq6SB1GRS71Yxa8',
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

const delay = (ms) => new Promise((res) => setTimeout(res, ms))
const randomRange = (from, to) => {
  const delta = to - from
  return Math.round(Math.random() * delta + from)
}
const delayRange = (f = 1000, t = 1500) => delay(randomRange(f, t))
// const configDir = path.join(os.homedir(), '.config')
// const store = dataStore({ path: path.join(configDir, 'aizigao-tools.json') })

// TODO: xxx
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

export async function i18n(options) {
  // The target language
  const { cn, en, force } = options

  console.log(`[cn]: ${cn} [en]: ${en}`)
  if (!cn || !en) {
    console.log(chalk.red('请输入 cn 或 en 值'))
    return
  }

  if (!fs.existsSync(dist)) {
    console.log('i18目录不存在，已生成')
    fs.mkdirSync(dist)
  }

  let count = 1
  for (const [fileName, toCode] of CONFIG.toList) {
    console.log(`----------------- start ${count}, to ${toCode} ------------`)
    let result = null
    // 中文繁体与简体 处理
    const dictPath = path.join(__dirname, '_i18n_dict', fileName)
    let dict = {}
    if (dictPath) {
      console.log(`${toCode} 已加载字典数据`)
      const dictContent = await fs.readFile(dictPath)
      dict = JSON.parse(dictContent)
    }

    if (!force && cn in dict) {
      console.log(`${cn} 已存在原i18n中，跳过`)
      result = dict[cn]
    } else {
      if (['cht', 'zh'].includes(toCode)) {
        result = await translateSingle('zh', toCode, cn)
      } else {
        result = await translateSingle('en', toCode, en)
      }
    }

    await delayRange()
    let fileContent = {}
    const filePath = path.join(dist, fileName)
    if (fs.existsSync(filePath)) {
      const fileContentOrgin = await fs.readFile(filePath, 'utf-8')
      fileContent = JSON.parse(fileContentOrgin)
    }
    if (!(cn in fileContent)) {
      if (result) {
        fileContent[cn] = result
      } else {
        console.error('没有对应内容', cn, toCode, result)
      }
    }
    console.log(`to ${chalk.yellow(toCode)}`, 'ok')
    fs.writeFile(filePath, JSON.stringify(fileContent))
    console.log(
      `----------------- end ${count}, to ${toCode} ------------\n\n\n`
    )
  }
  console.log(chalk.green('okkkkkkkkkkkkk'))
}

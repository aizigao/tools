import localip from 'local-ip'
import chalk from 'chalk'
import qrcode from 'qrcode-terminal'
import { promisify } from 'util'

const localipAsync = promisify(localip)

/**
 *
 * @returns 获取本地ip
 */
const getLocalIp = async () => {
  try {
    const ip = await localipAsync('en0')
    return ip
  } catch (e) {
    console.error(chalk.red('获取本地IP失败\n'))
    console.log(e)
    process.exit(-1)
  }
}

const genQRcode = (qrStr, small = false) => {
  qrcode.setErrorLevel('Q')
  qrcode.generate(qrStr, { small })
}

export async function lsqr(options) {
  let realHost = options.host
  if (!options.host) {
    const localIp = await getLocalIp()
    realHost = 'http://' + localIp
  }
  const qrCodehref = realHost + ':' + options.port

  console.log('\n 当前地址: %s\n', chalk.green(qrCodehref))
  genQRcode(qrCodehref, options.small)
}

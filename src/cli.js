import yargs from 'yargs/yargs'
import { lsqr, tinyImg } from './main'

export async function cli(rawArgs) {
  // eslint-disable-next-line no-unused-expressions
  yargs(rawArgs)
    .usage('Usage: $0 <command> [args...]')
    .command(
      'lsqr [--port | -p] [--host]',
      '生成网页二维码',
      (yargsSub) => {
        yargsSub
          .positional('port', {
            describe: '端口号',
            type: 'number',
            default: '80',
            alias: 'p',
          })
          .positional('host', {
            describe: 'host域名',
            type: 'string',
          })
          .positional('small', {
            describe: '生成小号二维码',
            type: 'boolean',
            default: false,
          })
      },
      (argv) => {
        lsqr(argv)
      }
    )
    .command(
      'tiny-img [source] [-c | --config]',
      '压缩图片 (支持svg)',
      (yargsSub) => {
        yargsSub
          .option('config', {
            describe: '进行配置',
            type: 'boolean',
            default: false,
            alias: 'c',
          })
          .positional('source', {
            describe: '文件目录',
            type: 'string',
          })
      },
      async (argv) => {
        // console.log(argv)
        tinyImg(argv)
      }
    )
    .demandCommand()
    .strictCommands()
    .alias('h', 'help')
    .help().argv
}

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
          .help()
      },
      (argv) => {
        lsqr(argv)
      }
    )
    .command(
      'tiny-img [--config|-c] <path>',
      '压缩图片 (支持svg)',
      (yargsSub) => {
        yargsSub
          .positional('config', {
            describe: '端口',
            type: 'boolean',
            alias: 'c',
          })
          .help()
      },
      (argv) => {
        tinyImg(argv)
      }
    )
    .demandCommand()
    .strictCommands()
    .alias('h', 'help')
    .help().argv
}

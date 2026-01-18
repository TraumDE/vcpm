import {Command, Flags} from '@oclif/core'

export class Test extends Command {
  static description = 'test command'
  static flags = {
    dev: Flags.boolean({char: 'd'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Test)

    if (flags.dev) this.log('dev mode')

    this.log('test command')
  }
}

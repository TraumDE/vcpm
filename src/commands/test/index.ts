import {Command, Flags} from '@oclif/core'

export class Test extends Command {
  static description = 'test command'
  static flags = {
    test: Flags.boolean({char: 't'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Test)

    if (flags.test) this.log('test flag')

    this.log('test command')
  }
}

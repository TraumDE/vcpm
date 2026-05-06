import {Command} from '@oclif/core'

export class Create extends Command {
  static description = 'Create a new voxel core project'
  static flags = {
    name: {
      description: 'Project name (target directory):',
      required: false,
      type: 'string',
    },
  }

  public async run(): Promise<void> {
    const flags = await this.parse(Create)
    this.log(`Creating a new voxel core project...`, flags)
  }
}

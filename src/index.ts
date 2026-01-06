#!/usr/bin/env node
import { Command } from "commander";

const program: Command = new Command();

program
  .name("vcpm")
  .description(
    "VCPM - Voxel Core Project Manager. Is unoficall CLI util for managing content packs"
  )
  .version("0.1.0");

program.parse();

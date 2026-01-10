#!/usr/bin/env node
import { Command } from "commander";
import build from "./commands/build";

const program: Command = new Command();

program
  .name("vcpm")
  .description(
    "VCPM - Voxel Core Project Manager. Is unoficall CLI util for managing content packs",
  )
  .version("0.1.0");

program
  .command("build")
  .description("Build project for production")
  .option("-d, --dev", "Build project for development", false)
  .action(build);

program.parse();

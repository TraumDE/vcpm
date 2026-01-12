#!/usr/bin/env node
import { program, Option } from "@gutenye/commander-completion-carapace";
import build from "./commands/build.js";

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

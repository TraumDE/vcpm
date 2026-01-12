#!/usr/bin/env node
import { program, Option } from "@gutenye/commander-completion-carapace";
import build from "./commands/build.js";

program
  .name("vcpm")
  .description(
    "VCPM - Voxel Core Project Manager. Is unoficall CLI util for managing content packs",
  )
  .version("0.3.0")
  .enableCompletion();

program
  .command("build")
  .description("Build project for production")
  .option("-d, --dev", "Build project for development", false)
  .completion({
    positionalany: ["$files"],
  })
  .action(build);

await program.installCompletion();

program.parse();

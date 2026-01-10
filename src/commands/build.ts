import { cwd } from "process";
import fs from "fs";
import { join } from "path";
import archiver from "archiver";
import type { PackInfo, BuildOptions } from "../types";
import { log } from "console";

const isExists = (path: string): boolean => {
  return fs.existsSync(join(cwd(), path));
};

const getPackData = (): PackInfo => {
  const jsonData = JSON.parse(
    fs.readFileSync(join(cwd(), "package.json"), "utf-8"),
  );

  return {
    id: jsonData.id,
    version: jsonData.version,
  };
};

const createDistZip = (isDev: boolean): void => {
  if (!isExists("package.json")) {
    console.log("Not found package.json!");
    return;
  }

  const packData: PackInfo = getPackData();
  const distPath = `dist/${packData.id}_${packData.version}.zip`;

  if (isExists(distPath)) {
    fs.rmSync(distPath);
  }

  const output = fs.createWriteStream(distPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  archive.pipe(output);
  archive.glob("**/*", {
    cwd: ".",
    ignore: isDev ? [] : ["**/.*/**", "**/.*", "modules/types/**", "dist/**"],
    dot: true,
  });
  archive.finalize();

  if (isDev) {
    console.log("Project builded for development!");
  } else {
    console.log("Project builded for production!");
  }
};

const checkDistFolder = (): void => {
  if (!isExists("dist")) {
    fs.mkdirSync("dist");
  }
};

export default (options: BuildOptions): void => {
  checkDistFolder();
  createDistZip(options.dev);
};

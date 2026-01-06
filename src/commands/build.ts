import { cwd } from "process";
import fs from "fs";
import { join } from "path";

export default (): void => {
  const currentDir: string = cwd();
  const productionFolder: string = "dist";

  try {
    if (!fs.existsSync(join(currentDir, productionFolder))) {
      fs.mkdirSync(`dist`);
    }
  } catch (error) {
    console.log(`Failed to create production folder: ${error}`);
  }
};

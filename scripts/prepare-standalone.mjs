import { cpSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const standaloneDir = join(".next", "standalone");

if (!existsSync(standaloneDir)) {
  process.exit(0);
}

const copies = [
  [join(".next", "static"), join(standaloneDir, ".next", "static")],
  ["public", join(standaloneDir, "public")],
];

for (const [source, destination] of copies) {
  if (!existsSync(source)) {
    continue;
  }

  rmSync(destination, { force: true, recursive: true });
  cpSync(source, destination, { recursive: true });
}

import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

const candidates = [
  ".output/server/index.mjs",
  "../.output/server/index.mjs",
  "../../.output/server/index.mjs",
]

const entry = candidates
  .map((relativePath) => resolve(process.cwd(), relativePath))
  .find((absolutePath) => existsSync(absolutePath))

if (!entry) {
  console.error("Could not find Nitro server entry (.output/server/index.mjs) from current working directory.")
  console.error(`cwd: ${process.cwd()}`)
  process.exit(1)
}

await import(pathToFileURL(entry).href)
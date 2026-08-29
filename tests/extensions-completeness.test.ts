import test, { describe, it } from "node:test"
import assert from "node:assert"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { EXTENSION_REGISTRY } from "../src/lib/registry.ts"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CONTENTS_DIR = path.resolve(__dirname, "../src/contents")

// Map of extension ID to known content script filename prefix if different from ID
const ID_TO_FILE_MAPPING: Record<string, string> = {
  "yt-music-redirect": "youtube-music-redirect"
}

describe("Extension Implementation Completeness", () => {
  const contentFiles = fs.readdirSync(CONTENTS_DIR)

  it("should have an existing content script file for every implemented extension", () => {
    const implemented = EXTENSION_REGISTRY.filter((ext) => ext.isImplemented)

    for (const ext of implemented) {
      const filePrefix = ID_TO_FILE_MAPPING[ext.id] || ext.id
      const matchingFile = contentFiles.find(
        (f) => f === `${filePrefix}.ts` || f === `${filePrefix}.tsx`
      )

      assert.ok(
        matchingFile,
        `Extension '${ext.id}' is marked isImplemented: true, but no matching content script was found in src/contents/ (looked for '${filePrefix}.ts' or '${filePrefix}.tsx')`
      )
    }
  })

  it("should have non-empty content scripts that export valid Plasmo configuration", () => {
    const implemented = EXTENSION_REGISTRY.filter((ext) => ext.isImplemented)

    for (const ext of implemented) {
      const filePrefix = ID_TO_FILE_MAPPING[ext.id] || ext.id
      const matchingFile = contentFiles.find(
        (f) => f === `${filePrefix}.ts` || f === `${filePrefix}.tsx`
      )

      if (matchingFile) {
        const fullPath = path.join(CONTENTS_DIR, matchingFile)
        const fileContent = fs.readFileSync(fullPath, "utf8")
        assert.ok(
          fileContent.trim().length > 50,
          `Content script '${matchingFile}' for extension '${ext.id}' appears empty or stubbed`
        )
        assert.ok(
          fileContent.includes("config: PlasmoCSConfig") || fileContent.includes("export const config"),
          `Content script '${matchingFile}' must export PlasmoCSConfig config`
        )
      }
    }
  })
})

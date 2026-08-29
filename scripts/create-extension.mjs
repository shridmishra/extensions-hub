#!/usr/bin/env node

/**
 * Extensions Hub - Micro-Extension Scaffolding CLI
 *
 * Usage:
 *   node scripts/create-extension.mjs
 *   node scripts/create-extension.mjs --name "Pixel Inspector" --type interactive --category "Developer"
 */

import fs from "node:fs"
import path from "node:path"
import readline from "node:readline"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, "..")

const ALLOWED_CATEGORIES = [
  "Typography",
  "Color & Design",
  "Accessibility",
  "Developer",
  "Utility"
]

const ALLOWED_TYPES = ["interactive", "background"]

function parseArgs() {
  const args = process.argv.slice(2)
  const options = {}
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith("--")) {
      const key = arg.slice(2)
      const next = args[i + 1]
      if (next && !next.startsWith("--")) {
        options[key] = next
        i++
      } else {
        options[key] = true
      }
    }
  }
  return options
}

function toKebabCase(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function toSnakeCase(str) {
  return toKebabCase(str).replace(/-/g, "_")
}

function toPascalCase(str) {
  return str
    .replace(/[-_ ]+(\w)/g, (_, c) => c.toUpperCase())
    .replace(/^(\w)/, (_, c) => c.toUpperCase())
}

async function prompt(question, defaultValue = "") {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  return new Promise((resolve) => {
    const display = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `
    rl.question(display, (answer) => {
      rl.close()
      resolve(answer.trim() || defaultValue)
    })
  })
}

async function main() {
  console.log("\n🚀 \x1b[1m\x1b[36mExtension Hub - Create New Micro-Extension\x1b[0m\n")

  const args = parseArgs()
  const isDryRun = !!args["dry-run"]

  let name = args.name
  if (!name) {
    name = await prompt("Extension Name (e.g. JSON Formatter)")
    if (!name) {
      console.error("\x1b[31mError: Extension name is required.\x1b[0m")
      process.exit(1)
    }
  }

  let id = args.id || toKebabCase(name)
  let shortName = args["short-name"] || name

  let type = args.type
  if (!type || !ALLOWED_TYPES.includes(type)) {
    console.log("\nSelect extension type:")
    console.log("  1) interactive (on-page overlay, element picker, inspector)")
    console.log("  2) background  (site-wide rules, redirector, DOM modifier, toggleable)")
    const typeChoice = await prompt("Choose type (1/2)", "1")
    type = typeChoice === "2" ? "background" : "interactive"
  }

  let category = args.category
  if (!category || !ALLOWED_CATEGORIES.includes(category)) {
    console.log("\nSelect category:")
    ALLOWED_CATEGORIES.forEach((cat, idx) => {
      console.log(`  ${idx + 1}) ${cat}`)
    })
    const catChoice = await prompt("Choose category (1-5)", "5")
    const catIndex = parseInt(catChoice, 10) - 1
    category = ALLOWED_CATEGORIES[catIndex] || "Utility"
  }

  let icon = args.icon || (type === "interactive" ? "Wrench" : "ToggleLeft")
  const defaultDesc = `A modular ${category.toLowerCase()} micro-extension for Extension Hub.`
  let description =
    args.desc ||
    args.description ||
    (process.stdin.isTTY && !args.name
      ? await prompt("Description", defaultDesc)
      : defaultDesc)

  const defaultTags = `${id}, ${category.toLowerCase()}, utility`
  let tagsInput =
    args.tags ||
    (process.stdin.isTTY && !args.name
      ? await prompt("Tags (comma separated)", defaultTags)
      : defaultTags)
  const tags = tagsInput
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)

  const registryPath = path.join(ROOT_DIR, "src", "lib", "registry.ts")
  const registryContent = fs.readFileSync(registryPath, "utf8")

  // Check if ID already exists
  if (registryContent.includes(`id: "${id}"`)) {
    console.error(`\x1b[31mError: Extension with id "${id}" already exists in registry.ts.\x1b[0m`)
    process.exit(1)
  }

  // Determine highest extension number
  const numberMatches = [...registryContent.matchAll(/number:\s*(\d+)/g)]
  const maxNumber = numberMatches.reduce((max, m) => Math.max(max, parseInt(m[1], 10)), 0)
  const nextNumber = maxNumber + 1

  console.log("\n\x1b[32m✔ Extension Configuration:\x1b[0m")
  console.log(`  • Number:      #${nextNumber.toString().padStart(2, "0")}`)
  console.log(`  • ID:          ${id}`)
  console.log(`  • Name:        ${name}`)
  console.log(`  • Short Name:  ${shortName}`)
  console.log(`  • Type:        ${type}`)
  console.log(`  • Category:    ${category}`)
  console.log(`  • Icon:        ${icon}`)
  console.log(`  • Tags:        [${tags.join(", ")}]`)
  console.log(`  • Description: ${description}\n`)

  if (isDryRun) {
    console.log("\x1b[33m[Dry Run] No files were created.\x1b[0m")
    return
  }

  const snakeId = toSnakeCase(id)
  const upperId = snakeId.toUpperCase()
  const pascalName = toPascalCase(id)

  // 1. Create content script
  const contentExt = type === "interactive" ? "tsx" : "ts"
  const contentFilePath = path.join(ROOT_DIR, "src", "contents", `${id}.${contentExt}`)
  const templatePath = path.join(
    ROOT_DIR,
    "templates",
    type === "interactive" ? "interactive-extension.template.tsx" : "background-extension.template.ts"
  )

  let contentScriptCode = fs.readFileSync(templatePath, "utf8")
  contentScriptCode = contentScriptCode
    .replace(/__EXTENSION_ID__/g, id)
    .replace(/__EXTENSION_SNAKE_ID__/g, snakeId)
    .replace(/__EXTENSION_UPPER_ID__/g, upperId)
    .replace(/__EXTENSION_NAME__/g, name)
    .replace(/__EXTENSION_DESCRIPTION__/g, description)

  fs.writeFileSync(contentFilePath, contentScriptCode, "utf8")
  console.log(`\x1b[32m✔ Created content script:\x1b[0m src/contents/${id}.${contentExt}`)

  // 2. Create unit test
  const testFilePath = path.join(ROOT_DIR, "tests", `${id}.test.ts`)
  const testCode = `import test, { describe, it } from "node:test"
import assert from "node:assert"
import { EXTENSION_REGISTRY } from "../src/lib/registry.ts"

describe("${name} (#${nextNumber})", () => {
  it("should be registered with valid metadata", () => {
    const ext = EXTENSION_REGISTRY.find((e) => e.id === "${id}")
    assert.ok(ext, "Extension '${id}' should exist in EXTENSION_REGISTRY")
    assert.strictEqual(ext.name, "${name}")
    assert.strictEqual(ext.type, "${type}")
    assert.strictEqual(ext.category, "${category}")
    assert.strictEqual(ext.number, ${nextNumber})
    assert.strictEqual(ext.isImplemented, true)
    assert.ok(ext.tags.length > 0, "Extension must have tags")
  })
})
`
  fs.writeFileSync(testFilePath, testCode, "utf8")
  console.log(`\x1b[32m✔ Created test file:\x1b[0m     tests/${id}.test.ts`)

  // 3. Register in src/lib/registry.ts
  const newRegistryEntry = `  {
    id: "${id}",
    number: ${nextNumber},
    name: "${name}",
    shortName: "${shortName}",
    description: "${description.replace(/"/g, '\\"')}",
    category: "${category}",
    type: "${type}",
    icon: "${icon}",
    stars: 100,
    likes: 250,
    defaultPinned: false,
    defaultEnabled: false,
    tags: ${JSON.stringify(tags)},
    isImplemented: true
  },`

  const updatedRegistry = registryContent.replace(
    /(export const EXTENSION_REGISTRY: ExtensionManifestItem\[\] = \[[\s\S]*?)(\n\])/,
    `$1\n${newRegistryEntry}$2`
  )

  fs.writeFileSync(registryPath, updatedRegistry, "utf8")
  console.log(`\x1b[32m✔ Registered in:\x1b[0m         src/lib/registry.ts`)

  console.log("\n\x1b[1m\x1b[32m✨ Micro-Extension successfully scaffolded!\x1b[0m")
  console.log("\nNext Steps:")
  console.log(`  1. Implement your feature logic in: \x1b[36msrc/contents/${id}.${contentExt}\x1b[0m`)
  console.log(`  2. Run tests:                       \x1b[36mnpm test\x1b[0m`)
  console.log(`  3. Start dev server:                \x1b[36mnpm run dev\x1b[0m`)
  console.log(`  4. Load unpacked extension from:    \x1b[36mbuild/chrome-mv3-dev\x1b[0m\n`)
}

main().catch((err) => {
  console.error("\x1b[31mScaffolding failed:\x1b[0m", err)
  process.exit(1)
})

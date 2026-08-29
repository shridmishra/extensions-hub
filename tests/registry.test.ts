import test, { describe, it } from "node:test"
import assert from "node:assert"
import { EXTENSION_REGISTRY, type ExtensionCategory, type ExtensionType } from "../src/lib/registry.ts"

const VALID_CATEGORIES: ExtensionCategory[] = [
  "Typography",
  "Color & Design",
  "Accessibility",
  "Developer",
  "Utility"
]

const VALID_TYPES: ExtensionType[] = ["interactive", "background"]

describe("Extension Registry Integrity & Schema Validation", () => {
  it("should have at least one registered extension", () => {
    assert.ok(EXTENSION_REGISTRY.length > 0, "EXTENSION_REGISTRY must not be empty")
  })

  it("should have unique, kebab-case IDs for all extensions", () => {
    const idSet = new Set<string>()
    const kebabRegex = /^[a-z0-9-]+$/

    for (const ext of EXTENSION_REGISTRY) {
      assert.ok(ext.id, `Extension #${ext.number} is missing an ID`)
      assert.ok(
        kebabRegex.test(ext.id),
        `Extension ID '${ext.id}' must be lowercase kebab-case (e.g. 'font-finder')`
      )
      assert.strictEqual(
        idSet.has(ext.id),
        false,
        `Duplicate extension ID found: '${ext.id}'`
      )
      idSet.add(ext.id)
    }
  })

  it("should have unique positive numbers for all extensions", () => {
    const numberSet = new Set<number>()

    for (const ext of EXTENSION_REGISTRY) {
      assert.ok(
        Number.isInteger(ext.number) && ext.number > 0,
        `Extension '${ext.id}' number must be a positive integer, got ${ext.number}`
      )
      assert.strictEqual(
        numberSet.has(ext.number),
        false,
        `Duplicate extension number found: #${ext.number} in '${ext.id}'`
      )
      numberSet.add(ext.number)
    }
  })

  it("should have valid metadata fields for every extension", () => {
    for (const ext of EXTENSION_REGISTRY) {
      assert.ok(ext.name && ext.name.trim().length > 0, `Extension '${ext.id}' must have a name`)
      assert.ok(
        ext.shortName && ext.shortName.trim().length > 0,
        `Extension '${ext.id}' must have a shortName`
      )
      assert.ok(
        ext.description && ext.description.trim().length > 10,
        `Extension '${ext.id}' must have a descriptive description (> 10 chars)`
      )
      assert.ok(
        VALID_CATEGORIES.includes(ext.category),
        `Extension '${ext.id}' has invalid category '${ext.category}'. Allowed: ${VALID_CATEGORIES.join(", ")}`
      )
      assert.ok(
        VALID_TYPES.includes(ext.type),
        `Extension '${ext.id}' has invalid type '${ext.type}'. Allowed: ${VALID_TYPES.join(", ")}`
      )
      assert.ok(ext.icon && ext.icon.trim().length > 0, `Extension '${ext.id}' must specify an icon`)
      assert.ok(Array.isArray(ext.tags) && ext.tags.length > 0, `Extension '${ext.id}' must have tags`)
      for (const tag of ext.tags) {
        assert.strictEqual(typeof tag, "string")
        assert.ok(tag.length > 0, `Tags in '${ext.id}' must not be empty`)
      }
      assert.strictEqual(typeof ext.defaultPinned, "boolean")
      assert.strictEqual(typeof ext.defaultEnabled, "boolean")
      assert.strictEqual(typeof ext.isImplemented, "boolean")
      assert.ok(ext.stars >= 0, `Extension '${ext.id}' stars must be non-negative`)
      assert.ok(ext.likes >= 0, `Extension '${ext.id}' likes must be non-negative`)
    }
  })
})

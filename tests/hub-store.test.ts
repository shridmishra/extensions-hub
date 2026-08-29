import test, { describe, it } from "node:test"
import assert from "node:assert"
import {
  EXTENSION_REGISTRY,
  filterAndSortExtensions,
  getExtensionById
} from "../src/lib/registry.ts"

describe("Extension Catalog Filtering & Sorting Utilities", () => {
  it("should return all extensions when category is 'All' and query is empty", () => {
    const list = filterAndSortExtensions(EXTENSION_REGISTRY, {
      category: "All",
      query: ""
    })
    assert.strictEqual(list.length, EXTENSION_REGISTRY.length)
  })

  it("should filter extensions by category correctly", () => {
    const list = filterAndSortExtensions(EXTENSION_REGISTRY, {
      category: "Typography"
    })
    assert.ok(list.length > 0)
    for (const ext of list) {
      assert.strictEqual(ext.category, "Typography")
    }
  })

  it("should filter extensions by search query across name, shortName, and tags", () => {
    const fontList = filterAndSortExtensions(EXTENSION_REGISTRY, {
      query: "font"
    })
    assert.ok(fontList.length > 0)
    assert.ok(fontList.some((ext) => ext.id === "font-finder"))

    // Search by specific tag
    const eyedropperList = filterAndSortExtensions(EXTENSION_REGISTRY, {
      query: "eyedropper"
    })
    assert.ok(eyedropperList.some((ext) => ext.id === "color-picker"))
  })

  it("should sort catalog by number ascending by default", () => {
    const list = filterAndSortExtensions(EXTENSION_REGISTRY, {
      sortBy: "number"
    })
    for (let i = 0; i < list.length - 1; i++) {
      assert.ok(list[i].number <= list[i + 1].number, "List must be ordered by extension number")
    }
  })

  it("should sort catalog alphabetically by name", () => {
    const list = filterAndSortExtensions(EXTENSION_REGISTRY, {
      sortBy: "name"
    })
    for (let i = 0; i < list.length - 1; i++) {
      assert.ok(
        list[i].name.localeCompare(list[i + 1].name) <= 0,
        `Expected '${list[i].name}' to precede '${list[i + 1].name}'`
      )
    }
  })

  it("should sort catalog by stars descending including user-starred items", () => {
    const list = filterAndSortExtensions(EXTENSION_REGISTRY, {
      sortBy: "stars",
      starredIds: ["font-finder"]
    })
    assert.ok(list.length > 0)
  })

  it("should find extension by ID using getExtensionById", () => {
    const ext = getExtensionById("font-finder")
    assert.ok(ext)
    assert.strictEqual(ext.name, "Font Finder Inspector")

    const nonExistent = getExtensionById("unknown-tool-xyz")
    assert.strictEqual(nonExistent, undefined)
  })
})

import test, { describe, it } from "node:test"
import assert from "node:assert"
import { useHubStore } from "../src/store/hub-store.ts"
import { EXTENSION_REGISTRY } from "../src/lib/registry.ts"

describe("Drag and Drop Extension Reordering Tests", () => {
  it("should reorder pinned extension IDs correctly when dragging forward", async () => {
    const initialIds = ["font-finder", "color-picker", "css-inspector", "force-dark-mode"]
    useHubStore.setState({ pinnedIds: [...initialIds] })

    // Move item at index 0 ('font-finder') to index 2
    await useHubStore.getState().reorderPinned(0, 2)
    const updated = useHubStore.getState().pinnedIds
    assert.deepStrictEqual(updated, ["color-picker", "css-inspector", "font-finder", "force-dark-mode"])
  })

  it("should reorder pinned extension IDs correctly when dragging backward", async () => {
    const initialIds = ["color-picker", "css-inspector", "font-finder", "force-dark-mode"]
    useHubStore.setState({ pinnedIds: [...initialIds] })

    // Move item at index 2 ('font-finder') to index 0
    await useHubStore.getState().reorderPinned(2, 0)
    const updated = useHubStore.getState().pinnedIds
    assert.deepStrictEqual(updated, ["font-finder", "color-picker", "css-inspector", "force-dark-mode"])
  })

  it("should handle same index drag without altering order", async () => {
    const initialIds = ["font-finder", "color-picker", "page-ruler"]
    useHubStore.setState({ pinnedIds: [...initialIds] })

    await useHubStore.getState().reorderPinned(1, 1)
    const updated = useHubStore.getState().pinnedIds
    assert.deepStrictEqual(updated, initialIds)
  })

  it("should ignore out-of-bounds start or end indices", async () => {
    const initialIds = ["font-finder", "color-picker"]
    useHubStore.setState({ pinnedIds: [...initialIds] })

    await useHubStore.getState().reorderPinned(-1, 1)
    assert.deepStrictEqual(useHubStore.getState().pinnedIds, initialIds)

    await useHubStore.getState().reorderPinned(0, 99)
    assert.deepStrictEqual(useHubStore.getState().pinnedIds, initialIds)
  })

  it("should update getPinnedExtensions order when reordered", async () => {
    const initialIds = ["color-picker", "font-finder"]
    useHubStore.setState({ pinnedIds: [...initialIds] })

    let pinnedExts = useHubStore.getState().getPinnedExtensions()
    assert.strictEqual(pinnedExts[0].id, "color-picker")
    assert.strictEqual(pinnedExts[1].id, "font-finder")

    await useHubStore.getState().reorderPinned(0, 1)

    pinnedExts = useHubStore.getState().getPinnedExtensions()
    assert.strictEqual(pinnedExts[0].id, "font-finder")
    assert.strictEqual(pinnedExts[1].id, "color-picker")
  })

  it("should reorder pinned extension IDs directly by extension ID strings", async () => {
    const initialIds = ["page-ruler", "screenshot-capture", "color-palette", "font-finder"]
    useHubStore.setState({ pinnedIds: [...initialIds] })

    // Move 'font-finder' to position of 'page-ruler' (index 0)
    await useHubStore.getState().reorderPinned("font-finder", "page-ruler")
    assert.deepStrictEqual(
      useHubStore.getState().pinnedIds,
      ["font-finder", "page-ruler", "screenshot-capture", "color-palette"]
    )

    // Move 'screenshot-capture' to position of 'color-palette'
    await useHubStore.getState().reorderPinned("screenshot-capture", "color-palette")
    assert.deepStrictEqual(
      useHubStore.getState().pinnedIds,
      ["font-finder", "page-ruler", "color-palette", "screenshot-capture"]
    )
  })

  it("should set pinned IDs directly using setPinnedIds action", async () => {
    const newOrder = ["page-ruler", "screenshot-capture", "color-palette"]
    await useHubStore.getState().setPinnedIds(newOrder)
    assert.deepStrictEqual(useHubStore.getState().pinnedIds, newOrder)
  })
})

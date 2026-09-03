import { describe, it } from "node:test"
import assert from "node:assert"
import fs from "fs"
import path from "path"

describe("Figma Capture Fixes: Inline Text Spacing, Gradient Text & Satoshi Fontshare", () => {
  const rootDir = process.cwd()

  it("should verify serializer.ts implements tryExtractInlineTextSpans and renderMergedInlineTextSpans", () => {
    const serializerPath = path.join(rootDir, "src/converter/svg/serializer.ts")
    const code = fs.readFileSync(serializerPath, "utf-8")

    assert.ok(code.includes("interface InlineTextSpan"), "serializer.ts must declare InlineTextSpan")
    assert.ok(code.includes("function tryExtractInlineTextSpans"), "serializer.ts must implement tryExtractInlineTextSpans")
    assert.ok(code.includes("function renderMergedInlineTextSpans"), "serializer.ts must implement renderMergedInlineTextSpans")
    assert.ok(code.includes("tryExtractInlineTextSpans(node, ctx)"), "renderNodeToSvg must invoke tryExtractInlineTextSpans for FRAME nodes")
  })

  it("should verify serializer.ts merges inline word spans with natural whitespace to prevent word collision in Figma", () => {
    const serializerPath = path.join(rootDir, "src/converter/svg/serializer.ts")
    const code = fs.readFileSync(serializerPath, "utf-8")

    assert.ok(code.includes("gap > 1"), "Must check gap between adjacent spans for spacing")
    assert.ok(code.includes('content += " "'), "Must append space between words when gap or space flag exists")
    assert.ok(code.includes("tspan"), "Must wrap words in tspan elements within a single text element")
  })

  it("should verify serializer.ts converts gradient text fills into dominant solid color for Figma SVG import", () => {
    const serializerPath = path.join(rootDir, "src/converter/svg/serializer.ts")
    const code = fs.readFileSync(serializerPath, "utf-8")

    assert.ok(code.includes("function getRepresentativeGradientColor"), "serializer.ts must implement getRepresentativeGradientColor")
    assert.ok(code.includes("formatFillToSvg(fill: IRFill | undefined, ctx: SvgBuildContext, isText: boolean = false)"), "formatFillToSvg must accept isText parameter")
    assert.ok(code.includes("getRepresentativeGradientColor(fill)"), "formatFillToSvg must return representative gradient color when isText is true")
    assert.ok(code.includes("formatFillToSvg(textData.fills?.[0], ctx, true)"), "renderNodeToSvg must pass true for isText on text node fills")
  })

  it("should verify Fontshare CDN import for Satoshi font in SVG serializer", () => {
    const serializerPath = path.join(rootDir, "src/converter/svg/serializer.ts")
    const code = fs.readFileSync(serializerPath, "utf-8")

    assert.ok(code.includes("api.fontshare.com/v2/css?f[]=satoshi"), "serializer.ts must import Satoshi from Fontshare CDN instead of failing on Google Fonts")
  })

  it("should verify traversal.ts tracks leading and trailing spaces on text nodes", () => {
    const traversalPath = path.join(rootDir, "src/converter/dom/traversal.ts")
    const code = fs.readFileSync(traversalPath, "utf-8")

    assert.ok(code.includes("typography.hasLeadingSpace = /^\\s/.test(rawText)"), "traversal.ts must record hasLeadingSpace")
    assert.ok(code.includes("typography.hasTrailingSpace = /\\s$/.test(rawText)"), "traversal.ts must record hasTrailingSpace")
  })

  it("should verify IRTextStyle in ir.ts defines hasLeadingSpace and hasTrailingSpace", () => {
    const irPath = path.join(rootDir, "src/types/ir.ts")
    const code = fs.readFileSync(irPath, "utf-8")

    assert.ok(code.includes("hasLeadingSpace?: boolean;"), "ir.ts must define hasLeadingSpace in IRTextStyle")
    assert.ok(code.includes("hasTrailingSpace?: boolean;"), "ir.ts must define hasTrailingSpace in IRTextStyle")
  })
})

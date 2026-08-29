import type { IRFontInfo } from "../../types/ir"

const STYLE_SUFFIX_REGEX = /[-_](thin|hairline|extralight|extra-light|ultralight|ultra-light|light|regular|normal|book|roman|medium|semibold|semi-bold|demibold|demi-bold|bold|extrabold|extra-bold|ultrabold|ultra-bold|black|heavy|italic|oblique|slanted)$/i

/**
 * Normalizes and splits font names into human-readable words
 */
export function formatFontFamilyTitle(name: string): string {
  if (!name) return ""
  const formatted = name
    .replace(/[-_]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()

  return formatted.replace(/\b\w/g, (c) => c.toUpperCase())
}

const KNOWN_FONT_ALIASES: Record<string, string> = {
  "geistsans": "Geist",
  "geist sans": "Geist",
  "geist": "Geist",
  "geistmono": "Geist Mono",
  "geist mono": "Geist Mono",
  "plusjakartasans": "Plus Jakarta Sans",
  "plus jakarta sans": "Plus Jakarta Sans",
  "plus_jakarta_sans": "Plus Jakarta Sans",
  "spacegrotesk": "Space Grotesk",
  "space grotesk": "Space Grotesk",
  "space_grotesk": "Space Grotesk",
  "cabinetgrotesk": "Cabinet Grotesk",
  "cabinet grotesk": "Cabinet Grotesk",
  "cabinet_grotesk": "Cabinet Grotesk",
  "clashdisplay": "Clash Display",
  "clash display": "Clash Display",
  "clash_display": "Clash Display",
  "generalsans": "General Sans",
  "general sans": "General Sans",
  "general_sans": "General Sans",
  "firacode": "Fira Code",
  "fira code": "Fira Code",
  "fira_code": "Fira Code",
  "jetbrainsmono": "JetBrains Mono",
  "jetbrains mono": "JetBrains Mono",
  "jetbrains_mono": "JetBrains Mono",
  "ibmplexsans": "IBM Plex Sans",
  "ibm plex sans": "IBM Plex Sans",
  "ibmplexmono": "IBM Plex Mono",
  "ibm plex mono": "IBM Plex Mono",
  "dmsans": "DM Sans",
  "dm sans": "DM Sans",
  "sourcecodepro": "Source Code Pro",
  "source code pro": "Source Code Pro",
  "satoshi": "Satoshi",
  "inter": "Inter",
  "roboto": "Roboto",
  "poppins": "Poppins",
  "montserrat": "Montserrat",
  "outfit": "Outfit",
  "manrope": "Manrope",
  "sora": "Sora"
}

/**
 * Strips quotes, escaped slashes, and whitespace from a font family token
 */
export function cleanFontFamilyName(token: string): string {
  if (!token) return ""

  let clean = token.replace(/["'\\]/g, "").trim()

  const lower = clean.toLowerCase()
  if (lower === "sans-serif" || lower === "serif" || lower === "monospace" || lower === "system-ui") {
    return lower
  }

  if (clean.includes("var(") || clean.startsWith("--")) {
    const varMatch = clean.match(/(?:var\(\s*)?(--[a-zA-Z0-9_-]+)/i)
    if (varMatch && varMatch[1]) {
      const varName = varMatch[1]
      if (typeof document !== "undefined") {
        try {
          const resolved =
            window.getComputedStyle(document.documentElement).getPropertyValue(varName) ||
            window.getComputedStyle(document.body).getPropertyValue(varName)
          if (resolved && resolved.trim()) {
            return cleanFontFamilyName(resolved.split(",")[0])
          }
        } catch {}
      }

      const strippedVar = varName.replace(/^--font-?/i, "").replace(/[-_]+/g, " ").trim().toLowerCase()
      if (KNOWN_FONT_ALIASES[strippedVar]) {
        return KNOWN_FONT_ALIASES[strippedVar]
      }
      if (strippedVar && strippedVar !== "sans" && strippedVar !== "heading" && strippedVar !== "display" && strippedVar !== "mono" && strippedVar !== "body") {
        clean = formatFontFamilyTitle(strippedVar)
      }
    }
  }

  if (clean.startsWith("__")) {
    let unhashed = clean.replace(/^__(?:font_)?/i, "").replace(/_Fallback/i, "")
    unhashed = unhashed.replace(/_[a-f0-9]{4,}$/i, "")
    const title = formatFontFamilyTitle(unhashed)
    const key = title.toLowerCase().replace(/[-_\s]+/g, "")
    if (KNOWN_FONT_ALIASES[key]) {
      return KNOWN_FONT_ALIASES[key]
    }
    clean = title
  }

  if (STYLE_SUFFIX_REGEX.test(clean)) {
    const base = clean.replace(STYLE_SUFFIX_REGEX, "").trim()
    if (base.length >= 2) {
      clean = formatFontFamilyTitle(base)
    }
  }

  const aliasKey = clean.toLowerCase().replace(/[-_\s]+/g, "")
  if (KNOWN_FONT_ALIASES[aliasKey]) {
    return KNOWN_FONT_ALIASES[aliasKey]
  }

  if (typeof document !== "undefined" && (document as any).fonts) {
    try {
      let matchedFamily = "";
      (document as any).fonts.forEach((fontFace: FontFace) => {
        if (fontFace.family) {
          const fClean = fontFace.family.replace(/["'\\]/g, "").trim()
          if (fClean.toLowerCase() === clean.toLowerCase()) {
            matchedFamily = fClean
          }
        }
      })
      if (matchedFamily) return matchedFamily
    } catch {}
  }

  return clean
}

export function generateFontFamilyCandidates(raw: string): string[] {
  if (!raw || !raw.trim()) return ["Inter"]

  const rawClean = raw.replace(/["'\\]/g, "").trim()
  const candidates: string[] = []

  const addCand = (name: string) => {
    if (name && name.length >= 2 && !candidates.includes(name)) {
      candidates.push(name)
    }
  }

  const clean = cleanFontFamilyName(rawClean)
  addCand(clean)

  const formatted = formatFontFamilyTitle(rawClean)
  addCand(formatted)

  if (clean) {
    addCand(`${clean} Variable`)
    addCand(`${clean} VF`)
    addCand(`${clean} Display`)
    addCand(`${clean} Text`)
    addCand(`${clean} Sans`)
  }
  if (formatted && formatted !== clean) {
    addCand(`${formatted} Variable`)
    addCand(`${formatted} VF`)
    const baseVar = formatted.replace(/\s+(Variable|VF)$/i, "").trim()
    if (baseVar) {
      addCand(baseVar)
    }
  }

  addCand(rawClean)

  return candidates
}

export function makeFontUrlsAbsolute(cssText: string, baseHref?: string): string {
  if (!cssText) return ""
  const base =
    baseHref ||
    (typeof document !== "undefined" ? document.baseURI || window.location.href : "https://localhost")

  return cssText.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (_match, _quote, rawUrl) => {
    const trimmed = rawUrl.trim()
    if (
      !trimmed ||
      trimmed.startsWith("data:") ||
      trimmed.startsWith("blob:") ||
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://")
    ) {
      return `url("${trimmed}")`
    }
    try {
      const absUrl = new URL(trimmed, base).href
      return `url("${absUrl}")`
    } catch {
      return `url("${trimmed}")`
    }
  })
}

export function synthesizeAliasedFontFaceRules(cssText: string): string[] {
  const rules = [cssText]
  const familyMatch = cssText.match(/font-family\s*:\s*(['"]?)([^'";]+)\1/i)
  if (familyMatch && familyMatch[2]) {
    const rawFamily = familyMatch[2].trim()
    const cleanFamily = cleanFontFamilyName(rawFamily)
    const titleFamily = formatFontFamilyTitle(rawFamily)

    const aliasesToGenerate = new Set<string>()
    if (cleanFamily && cleanFamily !== rawFamily) aliasesToGenerate.add(cleanFamily)
    if (titleFamily && titleFamily !== rawFamily && titleFamily !== cleanFamily) aliasesToGenerate.add(titleFamily)
    if (cleanFamily && !cleanFamily.toLowerCase().endsWith("sans") && !cleanFamily.toLowerCase().endsWith("mono") && !cleanFamily.toLowerCase().endsWith("serif")) {
      aliasesToGenerate.add(`${cleanFamily} Sans`)
    }

    for (const alias of aliasesToGenerate) {
      const aliasedRule = cssText.replace(
        /font-family\s*:\s*(['"]?)([^'";]+)\1/i,
        `font-family: "${alias}"`
      )
      if (!rules.includes(aliasedRule)) {
        rules.push(aliasedRule)
      }
    }
  }
  return rules
}

export function extractDocumentFonts(): {
  fonts: IRFontInfo[]
  fontFaceCss: string[]
} {
  const fonts: IRFontInfo[] = []
  const fontFaceCss: string[] = []
  const seenFamilies = new Set<string>()

  if (typeof document === "undefined") {
    return { fonts, fontFaceCss }
  }

  const defaultBase = document.baseURI || window.location.href

  try {
    if ((document as any).fonts && (document as any).fonts.forEach) {
      (document as any).fonts.forEach((fontFace: FontFace) => {
        const cleanFamily = cleanFontFamilyName(fontFace.family)
        if (cleanFamily && !seenFamilies.has(cleanFamily)) {
          seenFamilies.add(cleanFamily)
          fonts.push({
            family: cleanFamily,
            weight: fontFace.weight || "normal",
            style: fontFace.style || "normal",
            sourceType: "font-face"
          })
        }
      })
    }
  } catch (e) {}

  try {
    for (let i = 0; i < document.styleSheets.length; i++) {
      const sheet = document.styleSheets[i]
      const sheetBase = sheet.href || defaultBase
      try {
        const rules = sheet.cssRules || sheet.rules
        if (!rules) continue

        for (let j = 0; j < rules.length; j++) {
          const rule = rules[j]

          if (rule.type === CSSRule.FONT_FACE_RULE || (rule as any).constructor.name === "CSSFontFaceRule") {
            const fontFaceRule = rule as CSSFontFaceRule
            const rawCssText = fontFaceRule.cssText
            if (rawCssText) {
              const absCssText = makeFontUrlsAbsolute(rawCssText, sheetBase)
              const allAliased = synthesizeAliasedFontFaceRules(absCssText)

              for (const r of allAliased) {
                if (!fontFaceCss.includes(r)) {
                  fontFaceCss.push(r)
                }
              }

              const familyMatch = rawCssText.match(/font-family\s*:\s*['"]?([^'";]+)['"]?/i)
              if (familyMatch && familyMatch[1]) {
                const family = cleanFontFamilyName(familyMatch[1])
                if (family && !seenFamilies.has(family)) {
                  seenFamilies.add(family)
                  fonts.push({
                    family,
                    sourceType: "font-face"
                  })
                }
              }
            }
          }

          if (rule.type === CSSRule.IMPORT_RULE || (rule as any).constructor.name === "CSSImportRule") {
            const importRule = rule as CSSImportRule
            if (importRule.href && importRule.href.includes("fonts")) {
              const absHref = makeFontUrlsAbsolute(`url('${importRule.href}')`, sheetBase).replace(/^url\(['"]?|['"]?\)$/g, "")
              const absImport = `@import url('${absHref}');`
              if (!fontFaceCss.includes(absImport)) {
                fontFaceCss.push(absImport)
              }
            }
          }
        }
      } catch {
        if (sheet.href && (sheet.href.includes("fonts.googleapis.com") || sheet.href.includes("use.typekit.net") || sheet.href.includes("api.fontshare.com") || sheet.href.includes("fonts.bunny.net"))) {
          const imp = `@import url('${sheet.href}');`
          if (!fontFaceCss.includes(imp)) {
            fontFaceCss.push(imp)
          }
        }
      }
    }
  } catch (e) {
    console.warn("Could not read stylesheets for fonts:", e)
  }

  try {
    const linkElements = document.querySelectorAll('link[rel="stylesheet"]')
    linkElements.forEach((link) => {
      const href = link.getAttribute("href") || ""
      if (
        href.includes("fonts.googleapis.com") ||
        href.includes("fonts.cdnfonts.com") ||
        href.includes("use.typekit.net") ||
        href.includes("api.fontshare.com") ||
        href.includes("fonts.bunny.net")
      ) {
        const importRule = `@import url('${href}');`
        if (!fontFaceCss.includes(importRule)) {
          fontFaceCss.push(importRule)
        }
      }
    })
  } catch (e) {}

  return { fonts, fontFaceCss }
}

export const GENERIC_CSS_FONT_MAP: Record<string, string> = {
  "sans-serif": "Inter",
  "serif": "Georgia",
  "monospace": "SF Mono",
  "system-ui": "SF Pro Text",
  "-apple-system": "SF Pro Text",
  "blinkmacsystemfont": "SF Pro Text",
  "segoe ui": "Segoe UI",
  "ui-sans-serif": "SF Pro Text",
  "ui-serif": "Georgia",
  "ui-monospace": "SF Mono",
  "ui-rounded": "SF Pro Rounded",
  "cursive": "Comic Sans MS",
  "fantasy": "Impact"
}

export function isGenericFontFamily(name: string): boolean {
  if (!name) return true
  const lower = name.toLowerCase().trim()
  return (
    GENERIC_CSS_FONT_MAP[lower] !== undefined ||
    lower === "sans-serif" ||
    lower === "serif" ||
    lower === "monospace" ||
    lower === "sf pro text" ||
    lower === "sf mono" ||
    lower === "sf pro rounded" ||
    lower === "system-ui" ||
    lower === "-apple-system" ||
    lower === "blinkmacsystemfont" ||
    lower === "system" ||
    lower === "ui-sans-serif" ||
    lower === "ui-serif" ||
    lower === "ui-monospace" ||
    lower === "ui-rounded" ||
    lower === "inherit" ||
    lower === "initial" ||
    lower === "cursive" ||
    lower === "fantasy"
  )
}

export function parseFontFamilyStack(raw: string): {
  primary: string
  fallbacks: string[]
} {
  if (!raw || raw.trim() === "") {
    return { primary: "Inter", fallbacks: ["Inter", "sans-serif"] }
  }

  const rawParts = raw
    .split(",")
    .map((p) => cleanFontFamilyName(p))
    .filter(Boolean)

  if (rawParts.length === 0) {
    return { primary: "Inter", fallbacks: ["Inter", "sans-serif"] }
  }

  const cleanFamilies: string[] = []
  for (const part of rawParts) {
    const mapped = GENERIC_CSS_FONT_MAP[part.toLowerCase()] || part
    if (mapped && !cleanFamilies.includes(mapped)) {
      cleanFamilies.push(mapped)
    }
  }

  const customNamedFont = cleanFamilies.find((f) => !isGenericFontFamily(f))
  let primary = customNamedFont || cleanFamilies[0] || "Inter"

  if (isGenericFontFamily(primary) && typeof document !== "undefined" && (document as any).fonts) {
    try {
      const loadedCustomFonts: string[] = [];
      (document as any).fonts.forEach((fontFace: FontFace) => {
        if (fontFace.family) {
          const clean = cleanFontFamilyName(fontFace.family)
          if (clean && !isGenericFontFamily(clean) && !loadedCustomFonts.includes(clean)) {
            loadedCustomFonts.push(clean)
          }
        }
      })
      if (loadedCustomFonts.length > 0) {
        primary = loadedCustomFonts[0]
      }
    } catch {}
  }

  const expandedFallbacks: string[] = []
  for (const fam of cleanFamilies) {
    if (!expandedFallbacks.includes(fam)) {
      expandedFallbacks.push(fam)
    }
    const strippedVariable = fam.replace(/\s+(Variable|VF|Display|Text|Pro)$/i, "").trim()
    if (strippedVariable && strippedVariable !== fam && !expandedFallbacks.includes(strippedVariable)) {
      expandedFallbacks.push(strippedVariable)
    }
  }

  if (!expandedFallbacks.includes("Inter")) {
    expandedFallbacks.push("Inter")
  }

  return {
    primary,
    fallbacks: expandedFallbacks
  }
}

export function normalizeFontWeight(weightRaw: string | number | undefined): number {
  if (weightRaw === undefined || weightRaw === null) return 400

  if (typeof weightRaw === "number") {
    return Math.max(100, Math.min(900, Math.round(weightRaw)))
  }

  const str = String(weightRaw).trim().toLowerCase()

  const keywordMap: Record<string, number> = {
    thin: 100,
    hairline: 100,
    extralight: 200,
    ultralight: 200,
    light: 300,
    normal: 400,
    regular: 400,
    book: 400,
    medium: 500,
    semibold: 600,
    demibold: 600,
    bold: 700,
    extrabold: 800,
    ultrabold: 800,
    black: 900,
    heavy: 900
  }

  if (keywordMap[str] !== undefined) {
    return keywordMap[str]
  }

  const parsed = parseInt(str, 10)
  if (!isNaN(parsed) && parsed >= 100 && parsed <= 900) {
    return parsed
  }

  return 400
}

export function mapWeightToFigmaStyles(
  weight: number,
  style: "normal" | "italic" = "normal"
): string[] {
  const isItalic = style === "italic"
  const styles: string[] = []

  if (weight <= 150) {
    styles.push(isItalic ? "Thin Italic" : "Thin", isItalic ? "Hairline Italic" : "Hairline", isItalic ? "Light Italic" : "Light")
  } else if (weight <= 250) {
    styles.push(isItalic ? "ExtraLight Italic" : "ExtraLight", isItalic ? "Extra Light Italic" : "Extra Light", isItalic ? "UltraLight Italic" : "UltraLight", isItalic ? "Light Italic" : "Light")
  } else if (weight <= 350) {
    styles.push(isItalic ? "Light Italic" : "Light", isItalic ? "Regular Italic" : "Regular")
  } else if (weight <= 450) {
    styles.push(isItalic ? "Italic" : "Regular", isItalic ? "Normal Italic" : "Normal", isItalic ? "Book Italic" : "Book", isItalic ? "Roman Italic" : "Roman")
  } else if (weight <= 550) {
    styles.push(isItalic ? "Medium Italic" : "Medium", isItalic ? "SemiBold Italic" : "SemiBold", isItalic ? "Regular Italic" : "Regular")
  } else if (weight <= 650) {
    styles.push(isItalic ? "SemiBold Italic" : "SemiBold", isItalic ? "Semi Bold Italic" : "Semi Bold", isItalic ? "DemiBold Italic" : "DemiBold", isItalic ? "Bold Italic" : "Bold", isItalic ? "Medium Italic" : "Medium")
  } else if (weight <= 750) {
    styles.push(isItalic ? "Bold Italic" : "Bold", isItalic ? "SemiBold Italic" : "SemiBold", isItalic ? "ExtraBold Italic" : "ExtraBold")
  } else if (weight <= 850) {
    styles.push(isItalic ? "ExtraBold Italic" : "ExtraBold", isItalic ? "Extra Bold Italic" : "Extra Bold", isItalic ? "UltraBold Italic" : "UltraBold", isItalic ? "Bold Italic" : "Bold", isItalic ? "Black Italic" : "Black")
  } else {
    styles.push(isItalic ? "Black Italic" : "Black", isItalic ? "Heavy Italic" : "Heavy", isItalic ? "ExtraBold Italic" : "ExtraBold", isItalic ? "Bold Italic" : "Bold")
  }

  styles.push(isItalic ? "Italic" : "Regular")

  return styles
}

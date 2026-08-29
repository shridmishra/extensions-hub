export interface CSSProperty {
  name: string
  value: string
  category: string
}

export interface BoxModelData {
  margin: { top: string; right: string; bottom: string; left: string }
  border: { top: string; right: string; bottom: string; left: string }
  padding: { top: string; right: string; bottom: string; left: string }
  width: string
  height: string
}

export interface ExtractedStyles {
  tagName: string
  className: string
  id: string
  dimensions: { width: string; height: string }
  categories: Record<string, CSSProperty[]>
  boxModel: BoxModelData
  rawCSS: string
  tailwindClasses: string
}

const CATEGORY_MAP: Record<string, string> = {
  // Dimensions & Layout
  display: "Layout",
  position: "Layout",
  top: "Layout",
  right: "Layout",
  bottom: "Layout",
  left: "Layout",
  "z-index": "Layout",
  float: "Layout",
  clear: "Layout",
  "box-sizing": "Layout",
  width: "Layout",
  height: "Layout",
  "max-width": "Layout",
  "max-height": "Layout",
  "min-width": "Layout",
  "min-height": "Layout",

  // Flexbox & Grid
  "flex-direction": "Flex & Grid",
  "flex-wrap": "Flex & Grid",
  "flex-grow": "Flex & Grid",
  "flex-shrink": "Flex & Grid",
  "flex-basis": "Flex & Grid",
  "justify-content": "Flex & Grid",
  "align-items": "Flex & Grid",
  "align-content": "Flex & Grid",
  order: "Flex & Grid",
  gap: "Flex & Grid",
  "row-gap": "Flex & Grid",
  "column-gap": "Flex & Grid",
  "grid-template-columns": "Flex & Grid",
  "grid-template-rows": "Flex & Grid",
  "grid-column": "Flex & Grid",
  "grid-row": "Flex & Grid",
  "grid-area": "Flex & Grid",

  // Typography
  color: "Typography",
  "font-family": "Typography",
  "font-size": "Typography",
  "font-weight": "Typography",
  "line-height": "Typography",
  "text-align": "Typography",
  "text-transform": "Typography",
  "text-decoration-line": "Typography",
  "text-decoration-style": "Typography",
  "text-decoration-color": "Typography",
  "letter-spacing": "Typography",
  "word-spacing": "Typography",
  "white-space": "Typography",
  "text-overflow": "Typography",

  // Spacing
  "margin-top": "Spacing",
  "margin-right": "Spacing",
  "margin-bottom": "Spacing",
  "margin-left": "Spacing",
  "padding-top": "Spacing",
  "padding-right": "Spacing",
  "padding-bottom": "Spacing",
  "padding-left": "Spacing",

  // Background & Styles
  "background-color": "Styling",
  "background-image": "Styling",
  "background-position": "Styling",
  "background-size": "Styling",
  "background-repeat": "Styling",
  opacity: "Styling",
  visibility: "Styling",
  cursor: "Styling",
  "box-shadow": "Styling",

  // Borders & Corners
  "border-top-width": "Borders",
  "border-top-style": "Borders",
  "border-top-color": "Borders",
  "border-right-width": "Borders",
  "border-right-style": "Borders",
  "border-right-color": "Borders",
  "border-bottom-width": "Borders",
  "border-bottom-style": "Borders",
  "border-bottom-color": "Borders",
  "border-left-width": "Borders",
  "border-left-style": "Borders",
  "border-left-color": "Borders",
  "border-top-left-radius": "Borders",
  "border-top-right-radius": "Borders",
  "border-bottom-right-radius": "Borders",
  "border-bottom-left-radius": "Borders",

  // Transforms & Transitions
  transition: "Effects",
  "transition-property": "Effects",
  "transition-duration": "Effects",
  "transition-timing-function": "Effects",
  "transition-delay": "Effects",
  transform: "Effects",
  filter: "Effects",
  "backdrop-filter": "Effects"
}

const IGNORED_VALUES = new Set([
  "none",
  "normal",
  "auto",
  "start",
  "visible",
  "transparent",
  "0px",
  "rgba(0, 0, 0, 0)",
  "initial",
  "inherit",
  "unset",
  "medium",
  "repeat"
])

export function extractStyles(element: HTMLElement): ExtractedStyles {
  const computed = window.getComputedStyle(element)
  const rect = element.getBoundingClientRect()

  const categories: Record<string, CSSProperty[]> = {
    Layout: [],
    "Flex & Grid": [],
    Spacing: [],
    Typography: [],
    Styling: [],
    Borders: [],
    Effects: []
  }

  Object.entries(CATEGORY_MAP).forEach(([propName, cat]) => {
    const value = computed.getPropertyValue(propName)
    if (value && value !== "") {
      categories[cat].push({
        name: propName,
        value,
        category: cat
      })
    }
  })

  const getPixelValue = (val: string) => {
    if (val === "auto") return "0"
    if (val.endsWith("px")) return Math.round(parseFloat(val)).toString()
    return val
  }

  const boxModel: BoxModelData = {
    margin: {
      top: getPixelValue(computed.getPropertyValue("margin-top")),
      right: getPixelValue(computed.getPropertyValue("margin-right")),
      bottom: getPixelValue(computed.getPropertyValue("margin-bottom")),
      left: getPixelValue(computed.getPropertyValue("margin-left"))
    },
    border: {
      top: getPixelValue(computed.getPropertyValue("border-top-width")),
      right: getPixelValue(computed.getPropertyValue("border-right-width")),
      bottom: getPixelValue(computed.getPropertyValue("border-bottom-width")),
      left: getPixelValue(computed.getPropertyValue("border-left-width"))
    },
    padding: {
      top: getPixelValue(computed.getPropertyValue("padding-top")),
      right: getPixelValue(computed.getPropertyValue("padding-right")),
      bottom: getPixelValue(computed.getPropertyValue("padding-bottom")),
      left: getPixelValue(computed.getPropertyValue("padding-left"))
    },
    width: Math.round(rect.width).toString(),
    height: Math.round(rect.height).toString()
  }

  const rawCSS = generateCleanCSS(element, computed)
  const tailwindClasses = generateTailwindClasses(element, computed)

  return {
    tagName: element.tagName.toLowerCase(),
    className: element.className,
    id: element.id,
    dimensions: {
      width: `${Math.round(rect.width)}px`,
      height: `${Math.round(rect.height)}px`
    },
    categories,
    boxModel,
    rawCSS,
    tailwindClasses
  }
}

function generateCleanCSS(element: HTMLElement, computed: CSSStyleDeclaration): string {
  const cssRules: string[] = []

  const isMeaningful = (prop: string) => {
    const val = computed.getPropertyValue(prop)
    return val && val !== "" && !IGNORED_VALUES.has(val)
  }

  // 1. Spacing - Margin
  const mTop = computed.getPropertyValue("margin-top")
  const mRight = computed.getPropertyValue("margin-right")
  const mBottom = computed.getPropertyValue("margin-bottom")
  const mLeft = computed.getPropertyValue("margin-left")
  if (mTop !== "0px" || mRight !== "0px" || mBottom !== "0px" || mLeft !== "0px") {
    if (mTop === mRight && mRight === mBottom && mBottom === mLeft) {
      cssRules.push(`margin: ${mTop};`)
    } else if (mTop === mBottom && mRight === mLeft) {
      cssRules.push(`margin: ${mTop} ${mRight};`)
    } else if (mRight === mLeft) {
      cssRules.push(`margin: ${mTop} ${mRight} ${mBottom};`)
    } else {
      cssRules.push(`margin: ${mTop} ${mRight} ${mBottom} ${mLeft};`)
    }
  }

  // 2. Spacing - Padding
  const pTop = computed.getPropertyValue("padding-top")
  const pRight = computed.getPropertyValue("padding-right")
  const pBottom = computed.getPropertyValue("padding-bottom")
  const pLeft = computed.getPropertyValue("padding-left")
  if (pTop !== "0px" || pRight !== "0px" || pBottom !== "0px" || pLeft !== "0px") {
    if (pTop === pRight && pRight === pBottom && pBottom === pLeft) {
      cssRules.push(`padding: ${pTop};`)
    } else if (pTop === pBottom && pRight === pLeft) {
      cssRules.push(`padding: ${pTop} ${pRight};`)
    } else if (pRight === pLeft) {
      cssRules.push(`padding: ${pTop} ${pRight} ${pBottom};`)
    } else {
      cssRules.push(`padding: ${pTop} ${pRight} ${pBottom} ${pLeft};`)
    }
  }

  // 3. Layout Essentials
  const display = computed.getPropertyValue("display")
  if (display && display !== "inline" && display !== "block") {
    cssRules.push(`display: ${display};`)
  } else if (display === "block" && element.tagName.toLowerCase() !== "div" && element.tagName.toLowerCase() !== "section" && element.tagName.toLowerCase() !== "p") {
    cssRules.push(`display: block;`)
  }

  const position = computed.getPropertyValue("position")
  if (position && position !== "static") {
    cssRules.push(`position: ${position};`)
    const top = computed.getPropertyValue("top")
    const right = computed.getPropertyValue("right")
    const bottom = computed.getPropertyValue("bottom")
    const left = computed.getPropertyValue("left")
    const zIndex = computed.getPropertyValue("z-index")
    if (top !== "auto") cssRules.push(`top: ${top};`)
    if (right !== "auto") cssRules.push(`right: ${right};`)
    if (bottom !== "auto") cssRules.push(`bottom: ${bottom};`)
    if (left !== "auto") cssRules.push(`left: ${left};`)
    if (zIndex !== "auto") cssRules.push(`z-index: ${zIndex};`)
  }

  if (display === "flex" || display === "inline-flex") {
    const fDir = computed.getPropertyValue("flex-direction")
    const fWrap = computed.getPropertyValue("flex-wrap")
    const jContent = computed.getPropertyValue("justify-content")
    const aItems = computed.getPropertyValue("align-items")
    const gap = computed.getPropertyValue("gap")

    if (fDir !== "row") cssRules.push(`flex-direction: ${fDir};`)
    if (fWrap !== "nowrap") cssRules.push(`flex-wrap: ${fWrap};`)
    if (jContent !== "normal" && jContent !== "start") cssRules.push(`justify-content: ${jContent};`)
    if (aItems !== "normal" && aItems !== "stretch") cssRules.push(`align-items: ${aItems};`)
    if (gap && gap !== "normal" && gap !== "0px") cssRules.push(`gap: ${gap};`)
  } else if (display === "grid" || display === "inline-grid") {
    const gTCols = computed.getPropertyValue("grid-template-columns")
    const gTRows = computed.getPropertyValue("grid-template-rows")
    const gap = computed.getPropertyValue("gap")

    if (gTCols && gTCols !== "none") cssRules.push(`grid-template-columns: ${gTCols};`)
    if (gTRows && gTRows !== "none") cssRules.push(`grid-template-rows: ${gTRows};`)
    if (gap && gap !== "normal" && gap !== "0px") cssRules.push(`gap: ${gap};`)
  }

  // 4. Typography
  if (isMeaningful("font-family")) {
    let font = computed.getPropertyValue("font-family")
    if (font.length > 50) {
      font = font.split(",")[0]
    }
    cssRules.push(`font-family: ${font};`)
  }
  
  if (isMeaningful("font-size")) cssRules.push(`font-size: ${computed.getPropertyValue("font-size")};`)
  
  const fWeight = computed.getPropertyValue("font-weight")
  if (fWeight && fWeight !== "400" && fWeight !== "normal") {
    cssRules.push(`font-weight: ${fWeight};`)
  }

  const lHeight = computed.getPropertyValue("line-height")
  if (lHeight && lHeight !== "normal") {
    cssRules.push(`line-height: ${lHeight};`)
  }

  const color = computed.getPropertyValue("color")
  if (color && color !== "rgba(0, 0, 0, 0)" && color !== "rgb(0, 0, 0)" && color !== "rgb(15, 14, 19)") {
    cssRules.push(`color: ${color};`)
  }

  const tAlign = computed.getPropertyValue("text-align")
  if (tAlign && tAlign !== "start" && tAlign !== "left") {
    cssRules.push(`text-align: ${tAlign};`)
  }

  // 5. Backgrounds & Borders
  const bgColor = computed.getPropertyValue("background-color")
  if (bgColor && bgColor !== "rgba(0, 0, 0, 0)" && bgColor !== "transparent") {
    cssRules.push(`background-color: ${bgColor};`)
  }

  const bgImage = computed.getPropertyValue("background-image")
  if (bgImage && bgImage !== "none") {
    cssRules.push(`background-image: ${bgImage};`)
  }

  const btW = computed.getPropertyValue("border-top-width")
  const btS = computed.getPropertyValue("border-top-style")
  const btC = computed.getPropertyValue("border-top-color")
  const brW = computed.getPropertyValue("border-right-width")
  const brS = computed.getPropertyValue("border-right-style")
  const brC = computed.getPropertyValue("border-right-color")
  const bbW = computed.getPropertyValue("border-bottom-width")
  const bbS = computed.getPropertyValue("border-bottom-style")
  const bbC = computed.getPropertyValue("border-bottom-color")
  const blW = computed.getPropertyValue("border-left-width")
  const blS = computed.getPropertyValue("border-left-style")
  const blC = computed.getPropertyValue("border-left-color")

  const hasBorder = btW !== "0px" || brW !== "0px" || bbW !== "0px" || blW !== "0px"
  if (hasBorder) {
    if (btW === brW && brW === bbW && bbW === blW &&
        btS === brS && brS === bbS && bbS === blS &&
        btC === brC && brC === bbC && bbC === blC) {
      if (btW !== "0px" && btS !== "none") {
        cssRules.push(`border: ${btW} ${btS} ${btC};`)
      }
    } else {
      if (btW !== "0px" && btS !== "none") cssRules.push(`border-top: ${btW} ${btS} ${btC};`)
      if (brW !== "0px" && brS !== "none") cssRules.push(`border-right: ${brW} ${brS} ${brC};`)
      if (bbW !== "0px" && bbS !== "none") cssRules.push(`border-bottom: ${bbW} ${bbS} ${bbC};`)
      if (blW !== "0px" && blS !== "none") cssRules.push(`border-left: ${blW} ${blS} ${blC};`)
    }
  }

  const rtl = computed.getPropertyValue("border-top-left-radius")
  const rtr = computed.getPropertyValue("border-top-right-radius")
  const rbr = computed.getPropertyValue("border-bottom-right-radius")
  const rbl = computed.getPropertyValue("border-bottom-left-radius")
  if (rtl !== "0px" || rtr !== "0px" || rbr !== "0px" || rbl !== "0px") {
    if (rtl === rtr && rtr === rbr && rbr === rbl) {
      cssRules.push(`border-radius: ${rtl};`)
    } else {
      cssRules.push(`border-radius: ${rtl} ${rtr} ${rbr} ${rbl};`)
    }
  }

  const bShadow = computed.getPropertyValue("box-shadow")
  if (bShadow && bShadow !== "none" && bShadow !== "rgba(0, 0, 0, 0) 0px 0px 0px 0px") {
    cssRules.push(`box-shadow: ${bShadow};`)
  }

  const opacity = computed.getPropertyValue("opacity")
  if (opacity && opacity !== "1") {
    cssRules.push(`opacity: ${opacity};`)
  }

  const transform = computed.getPropertyValue("transform")
  if (transform && transform !== "none") {
    cssRules.push(`transform: ${transform};`)
  }

  const filter = computed.getPropertyValue("filter")
  if (filter && filter !== "none") {
    cssRules.push(`filter: ${filter};`)
  }

  const idStr = element.id ? `#${element.id}` : ""
  const classStr = element.className 
    ? `.${element.className.trim().split(/\s+/).join(".")}`.substring(0, 50)
    : ""
  const selector = `${element.tagName.toLowerCase()}${idStr}${classStr}`

  return `${selector} {\n${cssRules.map(r => `  ${r}`).join("\n")}\n}`
}

function rgbToHex(rgb: string): string {
  const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/)
  if (!match) return rgb
  
  const r = parseInt(match[1]).toString(16).padStart(2, '0')
  const g = parseInt(match[2]).toString(16).padStart(2, '0')
  const b = parseInt(match[3]).toString(16).padStart(2, '0')
  
  const a = match[4]
  if (a && parseFloat(a) < 1) {
    return rgb.replace(/\s+/g, '')
  }
  
  return `#${r}${g}${b}`
}

function cleanColorForTailwind(colorVal: string): string {
  if (colorVal.startsWith('rgb')) {
    const hex = rgbToHex(colorVal)
    if (hex.startsWith('#')) return hex
    return colorVal.replace(/\s+/g, '')
  }
  return colorVal.replace(/\s+/g, '')
}

function generateTailwindClasses(element: HTMLElement, computed: CSSStyleDeclaration): string {
  const classes: string[] = []
  const getProp = (prop: string) => computed.getPropertyValue(prop)

  const isMeaningful = (prop: string) => {
    const val = getProp(prop)
    return val && val !== "" && !IGNORED_VALUES.has(val)
  }

  // 1. Display
  const display = getProp("display")
  if (display && display !== "inline" && display !== "block") {
    if (display === "flex") classes.push("flex")
    else if (display === "grid") classes.push("grid")
    else if (display === "inline-flex") classes.push("inline-flex")
    else if (display === "inline-grid") classes.push("inline-grid")
    else if (display === "none") classes.push("hidden")
    else classes.push(`display-[${display}]`)
  }

  // 2. Flex & Grid Layout
  if (display === "flex" || display === "inline-flex") {
    const fDir = getProp("flex-direction")
    const fWrap = getProp("flex-wrap")
    const jContent = getProp("justify-content")
    const aItems = getProp("align-items")
    const gap = getProp("gap")

    if (fDir === "column") classes.push("flex-col")
    else if (fDir === "column-reverse") classes.push("flex-col-reverse")
    else if (fDir === "row-reverse") classes.push("flex-row-reverse")

    if (fWrap === "wrap") classes.push("flex-wrap")
    else if (fWrap === "wrap-reverse") classes.push("flex-wrap-reverse")
    else if (fWrap === "nowrap") classes.push("flex-nowrap")

    if (jContent === "center") classes.push("justify-center")
    else if (jContent === "flex-start" || jContent === "start") classes.push("justify-start")
    else if (jContent === "flex-end" || jContent === "end") classes.push("justify-end")
    else if (jContent === "space-between") classes.push("justify-between")
    else if (jContent === "space-around") classes.push("justify-around")
    else if (jContent === "space-evenly") classes.push("justify-evenly")

    if (aItems === "center") classes.push("items-center")
    else if (aItems === "flex-start" || aItems === "start") classes.push("items-start")
    else if (aItems === "flex-end" || aItems === "end") classes.push("items-end")
    else if (aItems === "baseline") classes.push("items-baseline")
    else if (aItems === "stretch") classes.push("items-stretch")

    if (gap && gap !== "normal" && gap !== "0px") {
      classes.push(`gap-[${gap.replace(/\s+/g, '')}]`)
    }
  } else if (display === "grid" || display === "inline-grid") {
    const gTCols = getProp("grid-template-columns")
    const gTRows = getProp("grid-template-rows")
    const gap = getProp("gap")

    if (gTCols && gTCols !== "none") {
      classes.push(`grid-cols-[${gTCols.replace(/\s+/g, '')}]`)
    }
    if (gTRows && gTRows !== "none") {
      classes.push(`grid-rows-[${gTRows.replace(/\s+/g, '')}]`)
    }
    if (gap && gap !== "normal" && gap !== "0px") {
      classes.push(`gap-[${gap.replace(/\s+/g, '')}]`)
    }
  }

  // 3. Position
  const position = getProp("position")
  if (position && position !== "static") {
    if (position === "absolute") classes.push("absolute")
    else if (position === "relative") classes.push("relative")
    else if (position === "fixed") classes.push("fixed")
    else if (position === "sticky") classes.push("sticky")

    const top = getProp("top")
    const right = getProp("right")
    const bottom = getProp("bottom")
    const left = getProp("left")
    const zIndex = getProp("z-index")

    if (top !== "auto") classes.push(`top-[${top.replace(/\s+/g, '')}]`)
    if (right !== "auto") classes.push(`right-[${right.replace(/\s+/g, '')}]`)
    if (bottom !== "auto") classes.push(`bottom-[${bottom.replace(/\s+/g, '')}]`)
    if (left !== "auto") classes.push(`left-[${left.replace(/\s+/g, '')}]`)
    if (zIndex !== "auto") classes.push(`z-[${zIndex}]`)
  }

  // 4. Dimensions
  const w = getProp("width")
  const h = getProp("height")
  const maxW = getProp("max-width")
  const maxH = getProp("max-height")
  const minW = getProp("min-width")
  const minH = getProp("min-height")

  if (w && w !== "auto") classes.push(`w-[${w}]`)
  if (h && h !== "auto") classes.push(`h-[${h}]`)
  if (maxW && maxW !== "none") classes.push(`max-w-[${maxW}]`)
  if (maxH && maxH !== "none") classes.push(`max-h-[${maxH}]`)
  if (minW && minW !== "0px" && minW !== "auto") classes.push(`min-w-[${minW}]`)
  if (minH && minH !== "0px" && minH !== "auto") classes.push(`min-h-[${minH}]`)

  // 5. Margin
  const mTop = getProp("margin-top")
  const mRight = getProp("margin-right")
  const mBottom = getProp("margin-bottom")
  const mLeft = getProp("margin-left")
  if (mTop !== "0px" || mRight !== "0px" || mBottom !== "0px" || mLeft !== "0px") {
    if (mTop === mRight && mRight === mBottom && mBottom === mLeft) {
      classes.push(`m-[${mTop}]`)
    } else {
      if (mTop === mBottom && mTop !== "0px") classes.push(`my-[${mTop}]`)
      else {
        if (mTop !== "0px") classes.push(`mt-[${mTop}]`)
        if (mBottom !== "0px") classes.push(`mb-[${mBottom}]`)
      }
      if (mRight === mLeft && mRight !== "0px") classes.push(`mx-[${mRight}]`)
      else {
        if (mRight !== "0px") classes.push(`mr-[${mRight}]`)
        if (mLeft !== "0px") classes.push(`ml-[${mLeft}]`)
      }
    }
  }

  // 6. Padding
  const pTop = getProp("padding-top")
  const pRight = getProp("padding-right")
  const pBottom = getProp("padding-bottom")
  const pLeft = getProp("padding-left")
  if (pTop !== "0px" || pRight !== "0px" || pBottom !== "0px" || pLeft !== "0px") {
    if (pTop === pRight && pRight === pBottom && pBottom === pLeft) {
      classes.push(`p-[${pTop}]`)
    } else {
      if (pTop === pBottom && pTop !== "0px") classes.push(`py-[${pTop}]`)
      else {
        if (pTop !== "0px") classes.push(`pt-[${pTop}]`)
        if (pBottom !== "0px") classes.push(`pb-[${pBottom}]`)
      }
      if (pRight === pLeft && pRight !== "0px") classes.push(`px-[${pRight}]`)
      else {
        if (pRight !== "0px") classes.push(`pr-[${pRight}]`)
        if (pLeft !== "0px") classes.push(`pl-[${pLeft}]`)
      }
    }
  }

  // 7. Typography
  if (isMeaningful("font-size")) classes.push(`text-[${getProp("font-size")}]`)
  
  const fWeight = getProp("font-weight")
  if (fWeight && fWeight !== "400" && fWeight !== "normal") {
    const weightMap: Record<string, string> = {
      "100": "font-thin",
      "200": "font-extralight",
      "300": "font-light",
      "400": "font-normal",
      "500": "font-medium",
      "600": "font-semibold",
      "700": "font-bold",
      "800": "font-extrabold",
      "900": "font-black"
    }
    classes.push(weightMap[fWeight] || `font-[${fWeight}]`)
  }

  const lHeight = getProp("line-height")
  if (lHeight && lHeight !== "normal") {
    classes.push(`leading-[${lHeight}]`)
  }

  const color = getProp("color")
  if (color && color !== "rgba(0, 0, 0, 0)" && color !== "rgb(0, 0, 0)" && color !== "rgb(15, 14, 19)") {
    classes.push(`text-[${cleanColorForTailwind(color)}]`)
  }

  const tAlign = getProp("text-align")
  if (tAlign && tAlign !== "start" && tAlign !== "left") {
    if (tAlign === "center") classes.push("text-center")
    else if (tAlign === "right") classes.push("text-right")
    else if (tAlign === "justify") classes.push("text-justify")
  }

  const tTransform = getProp("text-transform")
  if (tTransform && tTransform !== "none") {
    classes.push(tTransform)
  }

  const fStyle = getProp("font-style")
  if (fStyle === "italic") {
    classes.push("italic")
  }

  // 8. Background Color
  const bgColor = getProp("background-color")
  if (bgColor && bgColor !== "rgba(0, 0, 0, 0)" && bgColor !== "transparent") {
    classes.push(`bg-[${cleanColorForTailwind(bgColor)}]`)
  }

  // 9. Borders
  const btW = getProp("border-top-width")
  const brW = getProp("border-right-width")
  const bbW = getProp("border-bottom-width")
  const blW = getProp("border-left-width")
  const btC = getProp("border-top-color")
  const brC = getProp("border-right-color")
  const bbC = getProp("border-bottom-color")
  const blC = getProp("border-left-color")
  const btS = getProp("border-top-style")

  const hasBorder = btW !== "0px" || brW !== "0px" || bbW !== "0px" || blW !== "0px"
  if (hasBorder) {
    if (btW === brW && brW === bbW && bbW === blW) {
      if (btW !== "0px") {
        classes.push(`border-[${btW}]`)
        if (btC) classes.push(`border-[${cleanColorForTailwind(btC)}]`)
      }
    } else {
      if (btW !== "0px") classes.push(`border-t-[${btW}]`)
      if (brW !== "0px") classes.push(`border-r-[${brW}]`)
      if (bbW !== "0px") classes.push(`border-b-[${bbW}]`)
      if (blW !== "0px") classes.push(`border-l-[${blW}]`)
      if (btC) classes.push(`border-t-[${cleanColorForTailwind(btC)}]`)
      if (brC) classes.push(`border-r-[${cleanColorForTailwind(brC)}]`)
      if (bbC) classes.push(`border-b-[${cleanColorForTailwind(bbC)}]`)
      if (blC) classes.push(`border-l-[${cleanColorForTailwind(blC)}]`)
    }

    if (btS && btS !== "none" && btS !== "solid") {
      classes.push(`border-${btS}`)
    }
  }

  // Border Radius
  const rtl = getProp("border-top-left-radius")
  const rtr = getProp("border-top-right-radius")
  const rbr = getProp("border-bottom-right-radius")
  const rbl = getProp("border-bottom-left-radius")
  if (rtl !== "0px" || rtr !== "0px" || rbr !== "0px" || rbl !== "0px") {
    if (rtl === rtr && rtr === rbr && rbr === rbl) {
      classes.push(`rounded-[${rtl}]`)
    } else {
      if (rtl !== "0px") classes.push(`rounded-tl-[${rtl}]`)
      if (rtr !== "0px") classes.push(`rounded-tr-[${rtr}]`)
      if (rbr !== "0px") classes.push(`rounded-br-[${rbr}]`)
      if (rbl !== "0px") classes.push(`rounded-bl-[${rbl}]`)
    }
  }

  // 10. Shadow & Opacity & Effects
  const bShadow = getProp("box-shadow")
  if (bShadow && bShadow !== "none" && bShadow !== "rgba(0, 0, 0, 0) 0px 0px 0px 0px") {
    classes.push(`shadow-[${bShadow.replace(/\s+/g, '_')}]`)
  }

  const opacity = getProp("opacity")
  if (opacity && opacity !== "1") {
    classes.push(`opacity-[${opacity}]`)
  }

  const cursor = getProp("cursor")
  if (cursor && cursor !== "auto" && cursor !== "default") {
    classes.push(`cursor-${cursor}`)
  }

  return classes.join(" ")
}
